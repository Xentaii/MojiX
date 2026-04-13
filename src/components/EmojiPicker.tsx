import { MojiXRoot } from './MojiX';
import { EmojiGrid } from './EmojiGrid';
import { EmojiPreview } from './EmojiPreview';
import { EmojiSidebar } from './EmojiSidebar';
import { EmojiToolbar } from './EmojiToolbar';
import { getSlotClassName, getSlotStyle } from './utils';
import type { EmojiPickerProps } from '../lib/types';

export function EmojiPicker(props: EmojiPickerProps) {
  return (
    <MojiXRoot {...props}>
      {(state) => {
        const slotOptions = {
          unstyled: state.unstyled,
          classNames: state.classNames,
          styles: state.styles,
        };

        return (
          <>
            <div
              className={getSlotClassName('panel', slotOptions)}
              style={getSlotStyle('panel', slotOptions)}
              data-mx-slot="panel"
            >
              <EmojiToolbar
                searchId={state.searchId}
                searchQuery={state.searchQuery}
                onSearchChange={state.setSearchQuery}
                skinTone={state.skinTone}
                onSkinToneChange={state.setSkinTone}
                showSkinTones={state.showSkinTones}
                labels={state.labelSet}
                localeDefinition={state.localeDefinition}
                unstyled={state.unstyled}
                classNames={state.classNames}
                styles={state.styles}
              />

              <EmojiGrid
                ref={state.gridRef}
                sections={state.sections}
                emojiSize={state.emojiSize}
                columns={state.columns}
                skinTone={state.skinTone}
                value={state.value}
                spriteSheet={state.activeSpriteSheet}
                assetSource={state.gridAssetSource}
                localeDefinition={state.localeDefinition}
                renderEmoji={state.renderEmoji}
                onEmojiSelect={state.handleSelectEmoji}
                onEmojiHover={state.handleEmojiHover}
                onActiveCategoryChange={state.handleActiveCategoryChange}
                hoveredEmojiId={state.hoveredEmoji?.id ?? null}
                emptyState={state.emptyState}
                labels={state.labelSet}
                unstyled={state.unstyled}
                classNames={state.classNames}
                styles={state.styles}
              />

              {state.showPreview && (
                <EmojiPreview
                  emoji={state.previewEmoji}
                  selection={state.previewSelection}
                  spriteSheet={state.activeSpriteSheet}
                  assetSource={state.previewAssetSource}
                  renderPreview={state.renderPreview}
                  unstyled={state.unstyled}
                  classNames={state.classNames}
                  styles={state.styles}
                />
              )}
            </div>

            <EmojiSidebar
              sections={state.sections}
              activeCategory={state.activeCategory}
              onCategoryClick={state.handleCategoryClick}
              unstyled={state.unstyled}
              classNames={state.classNames}
              styles={state.styles}
            />
          </>
        );
      }}
    </MojiXRoot>
  );
}
