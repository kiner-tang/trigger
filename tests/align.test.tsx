import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { spyElementPrototypes } from 'rc-util/lib/test/domHook';
import React from 'react';
import type { TriggerProps } from '../src';
import Trigger from '../src';

import { _rs } from 'rc-resize-observer';

export const triggerResize = (target: Element) => {
  act(() => {
    _rs([{ target } as ResizeObserverEntry]);
  });
};

describe('Trigger.Align', () => {
  beforeAll(() => {
    spyElementPrototypes(HTMLDivElement, {
      getBoundingClientRect: () => ({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      }),
    });
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  async function awaitFakeTimer() {
    for (let i = 0; i < 10; i += 1) {
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });
    }
  }

  it('not show', async () => {
    const onAlign = jest.fn();

    const Demo = (props: Partial<TriggerProps>) => {
      const scrollRef = React.useRef<HTMLDivElement>(null);

      return (
        <>
          <div
            className="scroll"
            ref={scrollRef}
            // Jest can not get calculated style in jsdom. So we need to set it manually
            style={{ overflowX: 'hidden', overflowY: 'hidden' }}
          />
          <Trigger
            onPopupAlign={onAlign}
            popupAlign={{
              points: ['bl', 'tl'],
            }}
            popup={<strong>trigger</strong>}
            getPopupContainer={() => scrollRef.current!}
            {...props}
          >
            <div />
          </Trigger>
        </>
      );
    };

    const { rerender, container } = render(<Demo />);
    const scrollDiv = container.querySelector('.scroll')!;

    const mockAddEvent = jest.spyOn(scrollDiv, 'addEventListener');

    expect(mockAddEvent).not.toHaveBeenCalled();

    // Visible
    rerender(<Demo popupVisible />);
    expect(mockAddEvent).toHaveBeenCalled();

    // Scroll
    onAlign.mockReset();
    fireEvent.scroll(scrollDiv);

    await awaitFakeTimer();
    expect(onAlign).toHaveBeenCalled();
  });

  it('resize align', async () => {
    const onAlign = jest.fn();

    const { container } = render(
      <Trigger
        onPopupAlign={onAlign}
        popupVisible
        popupAlign={{
          points: ['bl', 'tl'],
        }}
        popup={<strong>trigger</strong>}
      >
        <span className="target" />
      </Trigger>,
    );

    await Promise.resolve();
    onAlign.mockReset();

    // Resize
    const target = container.querySelector('.target')!;
    triggerResize(target);

    await awaitFakeTimer();
    expect(onAlign).toHaveBeenCalled();
  });
});
