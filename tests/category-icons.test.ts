import { describe, expect, it } from 'vitest';
import { getLucideCategoryIconDefinition } from '../src/components/icons/lucideCategoryIconBodies';

describe('category icon registry', () => {
  it('loads extra Lucide icon bodies only through the optional entry', async () => {
    expect(getLucideCategoryIconDefinition('rocket')).toBeUndefined();

    const extraIcons = await import('../src/entries/icons/extra');

    expect(extraIcons.extraCategoryIconBodies.rocket?.lucideName).toBe(
      'rocket',
    );
    expect(getLucideCategoryIconDefinition('rocket')?.lucideName).toBe(
      'rocket',
    );
  });
});
