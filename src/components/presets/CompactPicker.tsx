import {
  MojiXEmpty,
  MojiXList,
  MojiXLoading,
  MojiXRoot,
  MojiXSearch,
  MojiXSkinToneButton,
  MojiXViewport,
} from '../MojiX';
import { getSlotClassName, getSlotStyle } from '../utils';
import type { EmojiPickerProps } from '../../core/types';

export interface CompactPickerProps extends EmojiPickerProps {}

export function CompactPicker(props: CompactPickerProps) {
  return (
    <MojiXRoot {...props}>
      {(state) => {
        const slotOptions = {
          unstyled: state.unstyled,
          classNames: state.classNames,
          styles: state.styles,
        };

        return (
          <div
            className={getSlotClassName('panel', slotOptions)}
            style={getSlotStyle('panel', slotOptions)}
            data-mx-slot="panel"
            data-mx-preset="compact"
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
          </div>
        );
      }}
    </MojiXRoot>
  );
}
