import React from 'react';
import { CategoryChip } from '../common/CategoryChip';
import { Select } from '../common/Select';
import { Button } from '../common/Button';

const CATEGORIES = [
  'All',
  'Music',
  'Food & Drink',
  'Sports',
  'Arts & Culture',
  'Community',
  'Markets',
  'Workshops',
  'Nightlife'
];

const RADIUS_OPTIONS = [
  { label: 'Within 1 km', value: 1 },
  { label: 'Within 5 km', value: 5 },
  { label: 'Within 10 km', value: 10 },
  { label: 'Within 15 km', value: 15 },
  { label: 'Within 25 km', value: 25 },
  { label: 'Within 50 km', value: 50 }
];

const DATE_OPTIONS = [
  { label: 'Any Date', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Weekend', value: 'weekend' },
  { label: 'Upcoming', value: 'upcoming' }
];

const PRICE_OPTIONS = [
  { label: 'All Prices', value: 'all' },
  { label: 'Free Only', value: 'free' },
  { label: 'Paid Only', value: 'paid' }
];

export const FilterBar = ({
  category = 'All',
  onCategoryChange,
  radius = 15,
  onRadiusChange,
  date = 'all',
  onDateChange,
  price = 'all',
  onPriceChange,
  onResetFilters,
  className = '',
  style = {}
}) => {
  const isAnyFilterActive =
    (category && category !== 'All') ||
    (Number(radius) !== 15) ||
    (date && date !== 'all') ||
    (price && price !== 'all');

  const activeFiltersCount = [
    category && category !== 'All',
    Number(radius) !== 15,
    date && date !== 'all',
    price && price !== 'all'
  ].filter(Boolean).length;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px 20px',
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border-subtle)',
        ...style
      }}
    >
      {/* Category Pills - Horizontally scrollable track */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          alignItems: 'center'
        }}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat}
            category={cat}
            isSelected={category === cat}
            onClick={() => onCategoryChange(cat)}
          />
        ))}
      </div>

      {/* Secondary Dropdown Controls Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {/* Radius Dropdown */}
        <div style={{ minWidth: '140px' }}>
          <Select
            options={RADIUS_OPTIONS}
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            style={{ marginBottom: 0 }}
          />
        </div>

        {/* Date Filter Dropdown */}
        <div style={{ minWidth: '140px' }}>
          <Select
            options={DATE_OPTIONS}
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>

        {/* Price Filter Dropdown */}
        <div style={{ minWidth: '130px' }}>
          <Select
            options={PRICE_OPTIONS}
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>

        {/* Clear Filters CTA */}
        {isAnyFilterActive && (
          <button
            type="button"
            onClick={onResetFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--color-bg-subtle)',
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: 'auto',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-subtle, rgba(15, 118, 110, 0.08))';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)';
              e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
            }}
          >
            <span>Reset Filters</span>
            {activeFiltersCount > 0 && (
              <span style={{
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}>
                {activeFiltersCount}
              </span>
            )}
            <span style={{ fontSize: '13px' }}>✕</span>
          </button>
        )}
      </div>
    </div>
  );
};
