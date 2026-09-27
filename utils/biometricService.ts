/**
 * @file biometricService.ts
 * @description WebAuthn platform authenticator (fingerprint/FaceID/TouchID) service
 * for Hirush Global AMS identity verification and anti-buddy-punching.
 */

import { BiometricDevice, User } from '../types';

// Helper: base64url encoding and decoding
export const bufferToBase64Url = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

export const base64UrlToBuffer = (base64url: string): Uint8Array => {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

/**
 * Get or create a persistent unique device ID on this physical browser
 */
export const getLocalDeviceId = (): string => {
    const STORAGE_KEY = 'hirush_ams_device_uuid';
    let deviceId = localStorage.getItem(STORAGE_KEY);
    if (!deviceId) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            deviceId = `dev_${crypto.randomUUID()}`;
        } else {
            deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        }
        localStorage.setItem(STORAGE_KEY, deviceId);
    }
    return deviceId;
};

/**
 * Generates a friendly device name based on User Agent
 */
export const getFriendlyDeviceName = (): string => {
    const ua = navigator.userAgent;
    let os = 'Unknown Device';

    if (/android/i.test(ua)) {
        // Try to match popular android models
        const match = ua.match(/;\s*([^;]+)\s+Build/i);
        const model = match && match[1] ? match[1].trim() : 'Android Phone';
        os = model;
    } else if (/iPhone/i.test(ua)) {
        os = 'Apple iPhone';
    } else if (/iPad/i.test(ua)) {
        os = 'Apple iPad';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
        os = 'MacBook / Mac';
    } else if (/Windows/i.test(ua)) {
        os = 'Windows PC / Laptop';
    } else if (/Linux/i.test(ua)) {
        os = 'Linux Device';
    }

    // Add browser info
    let browser = 'Browser';
    if (/Chrome/i.test(ua) && !/Edge|Edg|OPR/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Edg/i.test(ua)) browser = 'Edge';

    return `${os} (${browser})`;
};

/**
 * Checks if biometric (platform authenticator) is supported by this browser
 */
export const isBiometricSupported = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (!window.PublicKeyCredential) return false;

    try {
        if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            return available;
        }
        return false;
    } catch (err) {
        console.warn("Error checking biometric availability:", err);
        return false;
    }
};

/**
 * Registers this device's biometric sensor (thumb/fingerprint) using WebAuthn.
 */
export const registerDeviceBiometrics = async (
    user: User,
    autoApprove = false,
    slotLabel = 'Finger 1 (Thumb)',
    slotIndex = 1
): Promise<{ success: boolean; device?: BiometricDevice; error?: string }> => {
    try {
        const supported = await isBiometricSupported();
        if (!supported) {
            return {
                success: false,
                error: "Biometric sensor (fingerprint/face) is not supported or not available on this device."
            };
        }

        const deviceId = getLocalDeviceId();
        const deviceName = getFriendlyDeviceName();

        // 32-byte cryptographic challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const userIdBytes = new TextEncoder().encode(user.id);

        const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname);
        const rpEntity: PublicKeyCredentialRpEntity = {
            name: 'Hirush Global AMS'
        };
        if (!isIp) {
            rpEntity.id = window.location.hostname;
        }

        const createOptions: CredentialCreationOptions = {
            publicKey: {
                challenge,
                rp: rpEntity,
                user: {
                    id: userIdBytes,
                    name: user.email || user.employeeId || user.name,
                    displayName: user.name
                },
                pubKeyCredParams: [
                    { alg: -7, type: 'public-key' },  // ES256
                    { alg: -257, type: 'public-key' } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform', // Hardware sensor on this phone/device
                    userVerification: 'required',
                    requireResidentKey: false
                },
                timeout: 60000,
                attestation: 'none'
            }
        };

        const credential = await navigator.credentials.create(createOptions) as PublicKeyCredential | null;

        if (!credential) {
            return { success: false, error: "Biometric registration was cancelled or timed out." };
        }

        const credentialId = bufferToBase64Url(credential.rawId);

        const biometricDevice: BiometricDevice = {
            id: `bio_${Date.now()}_slot${slotIndex}`,
            credentialId,
            deviceId,
            deviceName,
            slotIndex,
            slotLabel,
            registeredAt: new Date().toISOString(),
            status: autoApprove ? 'approved' : 'pending_approval'
        };

        if (autoApprove) {
            biometricDevice.approvedAt = new Date().toISOString();
            biometricDevice.approvedBy = 'System (Auto)';
        }

        return {
            success: true,
            device: biometricDevice
        };
    } catch (error: any) {
        console.error("Biometric registration error:", error);
        if (error.name === 'NotAllowedError') {
            return { success: false, error: "Biometric prompt was cancelled or permission denied." };
        }
        return { success: false, error: error.message || "Failed to register biometric device." };
    }
};

/**
 * Triggers the phone's native biometric prompt (Fingerprint/TouchID) to verify attendance.
 * Accepts a single credentialId or an array of approved credentials (multi-finger).
 */
export const verifyBiometricPresence = async (
    credentialIds: string | string[]
): Promise<{ success: boolean; error?: string }> => {
    try {
        const idList = Array.isArray(credentialIds) ? credentialIds : [credentialIds];
        const validIds = idList.filter(id => !!id && typeof id === 'string');

        if (validIds.length === 0) {
            return { success: false, error: "No registered biometric credentials found." };
        }

        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const allowCredentials: PublicKeyCredentialDescriptor[] = validIds.map(id => ({
            id: base64UrlToBuffer(id),
            type: 'public-key' as const
        }));

        const getOptions: CredentialRequestOptions = {
            publicKey: {
                challenge,
                allowCredentials,
                userVerification: 'required',
                timeout: 60000
            }
        };

        const assertion = await navigator.credentials.get(getOptions);

        if (!assertion) {
            return { success: false, error: "Biometric verification was cancelled." };
        }

        return { success: true };
    } catch (error: any) {
        console.error("Biometric verification error:", error);
        if (error.name === 'NotAllowedError') {
            return { success: false, error: "Fingerprint verification cancelled or failed to match." };
        }
        return { success: false, error: error.message || "Biometric verification failed." };
    }
};
