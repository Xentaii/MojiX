import type {
  EmojiAssetSource,
  EmojiLocaleDefinition,
  EmojiPickerClassNames,
  EmojiPickerLabels,
  EmojiPickerStyles,
  EmojiSkinTone,
  EmojiSpriteSheetConfig,
} from '../lib/types';
import { EmojiSearchField } from './EmojiSearchField';
import { EmojiSkinToneButton } from './EmojiSkinToneButton';
import { getSlotClassName, getSlotStyle } from './utils';

export interface EmojiToolbarProps {
  searchId: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  skinTone: EmojiSkinTone;
  onSkinToneChange: (tone: EmojiSkinTone) => void;
  showSkinTones: boolean;
  labels: EmojiPickerLabels;
  localeDefinition: EmojiLocaleDefinition;
  spriteSheet?: EmojiSpriteSheetConfig;
  assetSource?: EmojiAssetSource;
  unstyled?: boolean;
  classNames?: EmojiPickerClassNames;
  styles?: EmojiPickerStyles;
}

export function EmojiToolbar({
  searchId,
  searchQuery,
  onSearchChange,
  skinTone,
  onSkinToneChange,
  showSkinTones,
  labels,
  localeDefinition,
  spriteSheet,
  assetSource,
  unstyled,
  classNames,
  styles,
}: EmojiToolbarProps) {
  const slotOptions = { unstyled, classNames, styles };

  return (
    <div
      className={getSlotClassName('toolbar', slotOptions)}
      style={getSlotStyle('toolbar', slotOptions)}
      data-mx-slot="toolbar"
    >
      <EmojiSearchField
        searchId={searchId}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        labels={labels}
        unstyled={unstyled}
        classNames={classNames}
        styles={styles}
      />

      {showSkinTones && (
        <EmojiSkinToneButton
          skinTone={skinTone}
          onSkinToneChange={onSkinToneChange}
          labels={labels}
          localeDefinition={localeDefinition}
          spriteSheet={spriteSheet}
          assetSource={assetSource}
          unstyled={unstyled}
          classNames={classNames}
          styles={styles}
        />
      )}
    </div>
  );
}
