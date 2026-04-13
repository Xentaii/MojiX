import type { EmojiCategoryId, EmojiSection } from '../lib/types';
import { createClassName } from './utils';

export interface EmojiSidebarProps {
  sections: EmojiSection[];
  activeCategory: EmojiCategoryId;
  onCategoryClick: (id: EmojiCategoryId) => void;
}

export function EmojiSidebar({
  sections,
  activeCategory,
  onCategoryClick,
}: EmojiSidebarProps) {
  return (
    <div className="mx-picker__sidebar" aria-label="Emoji categories">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={createClassName(
            'mx-picker__nav-button',
            activeCategory === section.id && 'is-active',
          )}
          onClick={() => onCategoryClick(section.id)}
          aria-label={section.label}
          title={section.label}
        >
          <span aria-hidden="true">{section.icon}</span>
        </button>
      ))}
    </div>
  );
}
