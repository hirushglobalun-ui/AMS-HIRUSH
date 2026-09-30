/**
 * File: components/shared/DomainManager/DomainFilterBar.tsx
 * Purpose: Search and filtering controls for the Domain Manager dashboard.
 * Author: Hirush Global AMS
 */

import React, { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import { DomainStatusFilter } from './types';

interface DomainFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: DomainStatusFilter;
  onStatusFilterChange: (status: DomainStatusFilter) => void;
  totalCount: number;
  healthIssueCount: number;
}

interface FilterOption {
  value: DomainStatusFilter;
  label: string;
}

const filterOptions: FilterOption[] = [
  {
    value: 'all',
    label: 'All Domains',
  },
  {
    value: 'critical',
    label: 'Critical Expiry (0 - 2 Days)',
  },
  {
    value: 'warning',
    label: 'Warning Expiry (3 - 7 Days)',
  },
  {
    value: 'active',
    label: 'Active Expiry (> 7 Days)',
  },
  {
    value: 'expired',
    label: 'Expired Domains',
  },
  {
    value: 'health-issue',
    label: 'DNS/SSL Issues',
  },
];

export const DomainFilterBar: React.FC<DomainFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  healthIssueCount,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption =
    filterOptions.find(
      (option) => option.value === statusFilter
    ) || filterOptions[0];

  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;

    const rect =
      buttonRef.current.getBoundingClientRect();

    const dropdownHeight = 260;

    const spaceBelow =
      window.innerHeight - rect.bottom;

    const spaceAbove = rect.top;

    let top = rect.bottom + 6;

    // If there isn't enough space below,
    // open above the button.
    if (
      spaceBelow < dropdownHeight &&
      spaceAbove > spaceBelow
    ) {
      top = rect.top - dropdownHeight - 6;
    }

    setDropdownPosition({
      top,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!isDropdownOpen) return;

    updateDropdownPosition();

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      setIsDropdownOpen(false);
    };

    const handleResize = () => {
      updateDropdownPosition();
    };

    const handleScroll = () => {
      updateDropdownPosition();
    };

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    window.addEventListener(
      'resize',
      handleResize
    );

    window.addEventListener(
      'scroll',
      handleScroll,
      true
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );

      window.removeEventListener(
        'resize',
        handleResize
      );

      window.removeEventListener(
        'scroll',
        handleScroll,
        true
      );
    };
  }, [isDropdownOpen]);

  const handleFilterSelect = (
    value: DomainStatusFilter
  ) => {
    onStatusFilterChange(value);
    setIsDropdownOpen(false);
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4">

      {/* Search */}
      <div className="md:col-span-2 relative min-w-0">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          size={18}
        />

        <input
          type="text"
          placeholder="Search by project name or domain URL..."
          value={searchQuery}
          onChange={(e) =>
            onSearchChange(e.target.value)
          }
          className="
            w-full
            min-w-0
            h-11
            pl-10
            pr-4
            rounded-xl
            border
            border-slate-200
            dark:border-slate-700
            bg-white/70
            dark:bg-slate-800/70
            backdrop-blur-sm
            focus:border-indigo-500
            focus:ring-4
            focus:ring-indigo-100
            outline-none
            text-sm
            text-slate-700
            dark:text-slate-200
            placeholder:text-slate-400
            transition-all
            shadow-sm
          "
        />
      </div>

      {/* Custom Domain Filter */}
      <div className="w-full min-w-0">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (!isDropdownOpen) {
              updateDropdownPosition();
            }

            setIsDropdownOpen(
              (previous) => !previous
            );
          }}
          className={`
            w-full
            min-w-0
            h-11
            px-3 sm:px-4
            rounded-xl
            border
            bg-white
            dark:bg-slate-800
            text-sm
            text-slate-800
            dark:text-slate-200
            outline-none
            shadow-sm
            transition-all
            flex
            items-center
            justify-between
            gap-2
            text-left
            ${isDropdownOpen
              ? 'border-indigo-600 ring-4 ring-indigo-500/15'
              : 'border-slate-300 dark:border-slate-700'
            }
          `}
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
        >
          <span className="truncate min-w-0">
            {selectedOption.label}
          </span>

          <ChevronDown
            size={18}
            className={`
              flex-shrink-0
              text-slate-500
              transition-transform
              duration-200
              ${isDropdownOpen
                ? 'rotate-180 text-indigo-600'
                : ''
              }
            `}
          />
        </button>

        {/* Custom Dropdown */}
        {isDropdownOpen &&
          typeof document !== 'undefined' &&
          createPortal(
            <>
              {/* Mobile backdrop */}
              <button
                type="button"
                aria-label="Close domain filter"
                onClick={() =>
                  setIsDropdownOpen(false)
                }
                className="
                  fixed
                  inset-0
                  z-[9998]
                  bg-transparent
                  md:hidden
                "
              />

              {/* Dropdown Menu */}
              <div
                ref={dropdownRef}
                className="
                  fixed
                  z-[9999]
                  overflow-hidden
                  rounded-xl
                  border
                  border-slate-200
                  dark:border-slate-700
                  bg-white
                  dark:bg-slate-800
                  shadow-2xl
                "
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                }}
              >
                <div className="max-h-[260px] overflow-y-auto py-1">

                  {filterOptions.map((option) => {
                    const isSelected =
                      option.value === statusFilter;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          handleFilterSelect(
                            option.value
                          )
                        }
                        className={`
                          w-full
                          min-h-[44px]
                          px-4
                          py-2.5
                          flex
                          items-center
                          justify-between
                          gap-3
                          text-left
                          text-sm
                          font-medium
                          transition-colors
                          ${isSelected
                            ? `
                                bg-indigo-50
                                dark:bg-indigo-950/40
                                text-indigo-700
                                dark:text-indigo-300
                              `
                            : `
                                text-slate-700
                                dark:text-slate-200
                                hover:bg-slate-50
                                dark:hover:bg-slate-700
                              `
                          }
                        `}
                      >
                        <span className="truncate">
                          {option.label}
                        </span>

                        {isSelected && (
                          <Check
                            size={17}
                            className="
                              flex-shrink-0
                              text-indigo-600
                              dark:text-indigo-400
                            "
                          />
                        )}
                      </button>
                    );
                  })}

                </div>
              </div>
            </>,
            document.body
          )}
      </div>

      {/* Total / Health Issues */}
      <div
        className="
          w-full
          min-w-0
          bg-slate-100
          dark:bg-slate-800
          rounded-xl
          p-1
          flex
          gap-1
        "
      >
        <button
          type="button"
          onClick={() =>
            onStatusFilterChange('all')
          }
          className={`
            flex-1
            min-w-0
            text-xs
            py-2.5
            px-2
            rounded-lg
            font-bold
            transition-all
            whitespace-nowrap
            ${statusFilter === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }
          `}
        >
          Total ({totalCount})
        </button>

        <button
          type="button"
          onClick={() =>
            onStatusFilterChange('health-issue')
          }
          className={`
            flex-1
            min-w-0
            text-xs
            py-2.5
            px-2
            rounded-lg
            font-bold
            transition-all
            whitespace-nowrap
            ${statusFilter === 'health-issue'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
            }
          `}
        >
          Health Issues ({healthIssueCount})
        </button>
      </div>
    </div>
  );
};