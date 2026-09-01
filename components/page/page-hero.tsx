'use client'

import { useRef, useState } from 'react'
import { ActionList, ActionMenu, AnchoredOverlay, Button, Stack } from '@primer/react'
import { ImageIcon, SmileyIcon, XIcon } from '@primer/octicons-react'
import type { Page } from '@/lib/types'
import { COVERS, coverCss } from '@/lib/seed'
import { useWorkspace } from '@/lib/workspace-store'

const EMOJIS = [
  '📝', '📚', '🗺️', '💡', '🚀', '🎯', '📌', '✅', '🧠', '🛠️', '🤝', '📊',
  '🌱', '🔥', '⭐', '🎨', '🧪', '📅', '💬', '🏠', '🎓', '🧭', '🔒', '🌈',
  '☕', '🍎', '🏆', '🎵', '📷', '✈️', '💼', '🧩',
]

interface PageHeroProps {
  page: Page
  onFocusFirstBlock: () => void
}

export function PageHero({ page, onFocusFirstBlock }: PageHeroProps) {
  const { updatePage } = useWorkspace()
  const [emojiOpen, setEmojiOpen] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const cover = coverCss(page.cover)

  function autoSize(el: HTMLTextAreaElement | null) {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  return (
    <div>
      {cover && (
        <div
          role="img"
          aria-label="Page cover"
          style={{
            position: 'relative',
            height: 200,
            width: '100%',
            background: cover,
          }}
        >
          <div
            className="page-hero-cover-actions"
            style={{
              position: 'absolute',
              right: 'var(--base-size-16)',
              bottom: 'var(--base-size-12)',
            }}
          >
            <Stack direction="horizontal" gap="condensed">
              <ActionMenu>
                <ActionMenu.Button size="small">Change cover</ActionMenu.Button>
                <ActionMenu.Overlay width="small" align="end">
                  <ActionList selectionVariant="single">
                    {COVERS.map((c) => (
                      <ActionList.Item
                        key={c.id}
                        selected={page.cover === c.id}
                        onSelect={() => updatePage(page.id, { cover: c.id })}
                      >
                        <ActionList.LeadingVisual>
                          <span
                            aria-hidden
                            style={{
                              display: 'inline-block',
                              width: 16,
                              height: 16,
                              borderRadius: 'var(--borderRadius-small)',
                              background: c.css,
                            }}
                          />
                        </ActionList.LeadingVisual>
                        {c.label}
                      </ActionList.Item>
                    ))}
                  </ActionList>
                </ActionMenu.Overlay>
              </ActionMenu>
              <Button size="small" leadingVisual={XIcon} onClick={() => updatePage(page.id, { cover: null })}>
                Remove
              </Button>
            </Stack>
          </div>
        </div>
      )}

      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: `0 var(--base-size-24)`,
          paddingTop: cover ? 0 : 'var(--base-size-64)',
        }}
      >
        <Stack direction="vertical" gap="condensed">
          {/* Icon */}
          {page.icon ? (
            <div style={{ marginTop: cover ? -36 : 0 }}>
              <AnchoredOverlay
                open={emojiOpen}
                onOpen={() => setEmojiOpen(true)}
                onClose={() => setEmojiOpen(false)}
                width="medium"
                renderAnchor={(props) => (
                  <button
                    {...props}
                    type="button"
                    aria-label="Change page icon"
                    style={{
                      fontSize: 72,
                      lineHeight: 1,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: 'var(--borderRadius-medium)',
                      padding: 'var(--base-size-4)',
                    }}
                  >
                    {page.icon}
                  </button>
                )}
              >
                <EmojiPicker
                  onPick={(e) => {
                    updatePage(page.id, { icon: e })
                    setEmojiOpen(false)
                  }}
                  onRemove={() => {
                    updatePage(page.id, { icon: null })
                    setEmojiOpen(false)
                  }}
                />
              </AnchoredOverlay>
            </div>
          ) : null}

          {/* Hover actions */}
          <Stack direction="horizontal" gap="condensed" className="page-hero-actions">
            {!page.icon && (
              <AnchoredOverlay
                open={emojiOpen}
                onOpen={() => setEmojiOpen(true)}
                onClose={() => setEmojiOpen(false)}
                width="medium"
                renderAnchor={(props) => (
                  <Button {...props} size="small" variant="invisible" leadingVisual={SmileyIcon}>
                    Add icon
                  </Button>
                )}
              >
                <EmojiPicker
                  onPick={(e) => {
                    updatePage(page.id, { icon: e })
                    setEmojiOpen(false)
                  }}
                />
              </AnchoredOverlay>
            )}
            {!page.cover && (
              <Button
                size="small"
                variant="invisible"
                leadingVisual={ImageIcon}
                onClick={() => updatePage(page.id, { cover: COVERS[0].id })}
              >
                Add cover
              </Button>
            )}
          </Stack>

          {/* Title */}
          <textarea
            ref={(el) => {
              titleRef.current = el
              autoSize(el)
            }}
            aria-label="Page title"
            placeholder="Untitled"
            value={page.title}
            rows={1}
            onChange={(e) => {
              updatePage(page.id, { title: e.target.value })
              autoSize(e.target)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                e.preventDefault()
                onFocusFirstBlock()
              }
            }}
            style={{
              width: '100%',
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--fgColor-default)',
              font: 'var(--text-display-shorthand)',
              fontSize: 40,
              lineHeight: 1.2,
              fontWeight: 700,
              fontFamily: 'var(--fontStack-sansSerifDisplay)',
              overflow: 'hidden',
            }}
          />
        </Stack>
      </div>
    </div>
  )
}

function EmojiPicker({ onPick, onRemove }: { onPick: (e: string) => void; onRemove?: () => void }) {
  return (
    <div style={{ padding: 'var(--base-size-12)' }}>
      <Stack direction="vertical" gap="condensed">
        <div
          role="listbox"
          aria-label="Choose an icon"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: 'var(--base-size-4)',
          }}
        >
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              role="option"
              aria-selected={false}
              aria-label={e}
              onClick={() => onPick(e)}
              className="emoji-option"
              style={{
                fontSize: 22,
                lineHeight: 1,
                aspectRatio: '1',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 'var(--borderRadius-medium)',
              }}
            >
              {e}
            </button>
          ))}
        </div>
        {onRemove && (
          <Button size="small" variant="invisible" onClick={onRemove}>
            Remove icon
          </Button>
        )}
      </Stack>
    </div>
  )
}
