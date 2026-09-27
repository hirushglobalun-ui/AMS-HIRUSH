const res1 = await fetch('https://firestore.googleapis.com/v1/projects/hirushglobal-llp/databases/(default)/documents/leads');
console.log('Leads Status:', res1.status);
const data1 = await res1.json();
console.log('Leads count:', data1.documents ? data1.documents.length : 0);

const res2 = await fetch('https://firestore.googleapis.com/v1/projects/hirushglobal-llp/databases/(default)/documents/domains');
console.log('Domains Status:', res2.status);
const data2 = await res2.json();
console.log('Domains count:', data2.documents ? data2.documents.length : 0);
