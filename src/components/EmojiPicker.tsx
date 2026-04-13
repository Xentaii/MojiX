import {
  MojiXActiveEmoji,
  MojiXCategoryNav,
  MojiXEmpty,
  MojiXList,
  MojiXLoading,
  MojiXRoot,
  MojiXSearch,
  MojiXSkinToneButton,
  MojiXViewport,
} from './MojiX';
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
              <div
                className={getSlotClassName('toolbar', slotOptions)}
                style={getSlotStyle('toolbar', slotOptions)}
                data-mx-slot="toolbar"
              >
                <MojiXSearch />
                {state.showSkinTones && <MojiXSkinToneButton />}
              </div>

              <MojiXViewport>
                <MojiXLoading />
                <MojiXEmpty />
                <MojiXList />
              </MojiXViewport>

              {state.showPreview && <MojiXActiveEmoji />}
            </div>

            <MojiXCategoryNav />
          </>
        );
      }}
    </MojiXRoot>
  );
}
