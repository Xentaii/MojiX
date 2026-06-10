import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { EmojiPickerProps, EmojiSelection } from '../../core/types';
import { EmojiPicker } from '../EmojiPicker';
import {
  computeEmojiPopoverPosition,
  type EmojiPopoverAlign,
  type EmojiPopoverPlacement,
  type EmojiPopoverPosition,
} from './positioning';

export interface EmojiPopoverTriggerProps {
  ref: (node: HTMLElement | null) => void;
  onClick: () => void;
  'aria-haspopup': 'dialog';
  'aria-expanded': boolean;
  open: boolean;
}

export interface EmojiPickerPopoverProps extends EmojiPickerProps {
  /**
   * Renders the element that toggles the popover. Spread the supplied props
   * onto your button so it gets the ref, click handler, and ARIA wiring.
   */
  trigger: (props: EmojiPopoverTriggerProps) => ReactNode;
  defaultOpen?: boolean;
  /** Preferred side; `'auto'` (default) flips to wherever the picker fits. */
  placement?: EmojiPopoverPlacement;
  /** Horizontal alignment relative to the trigger. Defaults to `'start'`. */
  align?: EmojiPopoverAlign;
  /** Gap between the trigger and the popover. Defaults to `8`. */
  offset?: number;
  /** Minimum gap kept from each viewport edge. Defaults to `8`. */
  viewportPadding?: number;
  /** Popover surface width in px. Defaults to `340`. */
  popoverWidth?: number;
  /** Popover surface height in px (capped to the viewport). Defaults to `420`. */
  popoverHeight?: number;
  /** Close when a pointer press lands outside the popover. Defaults to `true`. */
  closeOnOutsideClick?: boolean;
  /** Close the popover after an emoji is selected. Defaults to `true`. */
  closeOnSelect?: boolean;
  /** Opacity of the popover surface (0–1). Defaults to `1`. */
  opacity?: number;
  /** Render into `document.body` to avoid clipping. Defaults to `true`. */
  portal?: boolean;
  popoverClassName?: string;
  popoverStyle?: CSSProperties;
}

function getViewport() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

export function EmojiPickerPopover({
  trigger,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  placement = 'auto',
  align = 'start',
  offset = 8,
  viewportPadding = 8,
  popoverWidth = 340,
  popoverHeight = 420,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  closeOnSelect = true,
  opacity = 1,
  portal = true,
  popoverClassName,
  popoverStyle,
  onEmojiSelect,
  style: pickerStyle,
  ...pickerProps
}: EmojiPickerPopoverProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<EmojiPopoverPosition | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }

      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const setAnchor = useCallback((node: HTMLElement | null) => {
    anchorRef.current = node;
  }, []);

  // Position the popover, flipping/shifting to stay in the viewport, and keep
  // it positioned while open as the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    function update() {
      const anchor = anchorRef.current?.getBoundingClientRect();

      if (!anchor) {
        return;
      }

      setPosition(
        computeEmojiPopoverPosition({
          anchor: {
            top: anchor.top,
            left: anchor.left,
            width: anchor.width,
            height: anchor.height,
          },
          content: { width: popoverWidth, height: popoverHeight },
          viewport: getViewport(),
          placement,
          align,
          offset,
          padding: viewportPadding,
        }),
      );
    }

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [
    open,
    placement,
    align,
    offset,
    viewportPadding,
    popoverWidth,
    popoverHeight,
  ]);

  // Dismiss on outside pointer press / Escape, and return focus to the trigger.
  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!closeOnOutsideClick) {
        return;
      }

      const target = event.target as Node;

      if (
        contentRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (closeOnEscape && event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, closeOnOutsideClick, closeOnEscape, setOpen]);

  // Move focus into the picker on open; restore it to the trigger on close.
  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = anchorRef.current;
    const focusTarget = contentRef.current?.querySelector<HTMLElement>(
      'input, [tabindex], button',
    );

    focusTarget?.focus();

    return () => {
      previouslyFocused?.focus?.();
    };
  }, [open]);

  const handleSelect = useCallback(
    (selection: EmojiSelection) => {
      onEmojiSelect?.(selection);

      if (closeOnSelect) {
        setOpen(false);
      }
    },
    [onEmojiSelect, closeOnSelect, setOpen],
  );

  const triggerNode = trigger({
    ref: setAnchor,
    onClick: () => setOpen(!open),
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    open,
  });

  const content =
    open && position ? (
      <div
        ref={contentRef}
        role="dialog"
        aria-label="Emoji picker"
        className={popoverClassName}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: position.maxWidth,
          height: position.maxHeight,
          opacity,
          zIndex: 1000,
          ...popoverStyle,
        }}
      >
        <EmojiPicker
          {...pickerProps}
          open
          closeOnEscape={closeOnEscape}
          trapFocus
          onOpenChange={(next) => {
            if (!next) {
              setOpen(false);
            }
          }}
          onEmojiSelect={handleSelect}
          style={{ width: '100%', height: '100%', ...pickerStyle }}
        />
      </div>
    ) : open ? (
      // Mounted but not yet positioned: keep a measurable, invisible node so the
      // layout effect can place it before the browser paints.
      <div
        ref={contentRef}
        aria-hidden="true"
        style={{ position: 'fixed', visibility: 'hidden', top: 0, left: 0 }}
      />
    ) : null;

  return (
    <>
      {triggerNode}
      {content &&
        (portal && mounted ? createPortal(content, document.body) : content)}
    </>
  );
}
