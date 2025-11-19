# 🎨 Confirmation Dialog - Visual Style Guide

## Design System

### Color Palette (Glassmorphism)
```css
/* Background Layers */
backdrop: bg-background/80 backdrop-blur-md (outer dimmed layer)
card: bg-card/95 backdrop-blur-xl (dialog container)
gradient: from-primary/5 via-transparent to-secondary/5 (subtle glow)

/* Interactive Elements */
warning-bg: from-destructive/20 to-destructive/10 (icon background)
warning-text: text-destructive
warning-box: bg-destructive/10 border-destructive/20

/* Buttons */
confirm: from-destructive to-destructive/80 (red gradient)
cancel: bg-background/50 backdrop-blur-sm (glass effect)
```

### Spacing & Layout
```css
dialog-width: max-w-md (448px)
dialog-padding: p-8 (32px)
border-radius: rounded-3xl (24px)
gap: space-y-6 (24px vertical spacing)
```

### Typography
```css
title: text-2xl font-bold
subtitle: text-sm font-medium text-muted-foreground
message: text-base leading-relaxed text-muted-foreground
```

## Component Structure

```tsx
<ConfirmationDialog>
  ├── Backdrop (dimmed with blur)
  └── Dialog Container (glassmorphism card)
      ├── Gradient Glow Layer
      └── Content
          ├── Header (icon + title + item name)
          ├── Message
          ├── Warning Box
          └── Actions (cancel + confirm)
```

## Animation Timings

```css
fade-in: 300ms (opacity + scale)
fade-out: 200ms (opacity + scale)
hover: 200ms (button interactions)
```

## Usage Examples

### Delete Quiz
```tsx
<ConfirmationDialog
  isOpen={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  onConfirm={confirmDeleteQuiz}
  title="Delete Quiz"
  message="Are you sure you want to delete this quiz? All questions and student progress will be permanently removed."
  itemName={quizToDelete?.title}
  confirmText="Delete Quiz"
  cancelText="Cancel"
/>
```

### Delete Flashcard Deck
```tsx
<ConfirmationDialog
  isOpen={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  onConfirm={confirmDeleteDeck}
  title="Delete Flashcard Deck"
  message="Are you sure you want to delete this flashcard deck? All cards in this deck will be permanently removed."
  itemName={deckToDelete?.title}
  confirmText="Delete Deck"
  cancelText="Cancel"
/>
```

## Interaction States

### Default State
- Dialog hidden
- No backdrop visible
- Page scrollable

### Open State
- Dialog visible with fade-in animation
- Backdrop dims the background
- Page scroll locked
- Focus trapped within dialog

### Hover States
- Cancel button: subtle background brightening
- Confirm button: slight shadow increase + color shift
- Close on backdrop click

### Confirmation State
- Brief pause (200ms) for animation
- Success toast appears
- Dialog closes with fade-out
- Page scroll restored

## Accessibility Features

- ✅ Focus trap when dialog is open
- ✅ Backdrop click to close
- ✅ Proper ARIA labels
- ✅ Keyboard navigation support
- ✅ Visual hierarchy with icons and colors
- ✅ Clear action buttons with descriptive text

## Responsive Design

```css
/* Mobile (< 768px) */
- Full width with padding: p-4
- Smaller text: text-xl for title
- Stacked buttons if needed

/* Tablet & Desktop (≥ 768px) */
- Fixed max-width: max-w-md
- Side-by-side buttons
- Full padding: p-8
```

## Performance Optimizations

- Conditional rendering (only when `isOpen` is true)
- CSS transitions (GPU-accelerated)
- Debounced animations
- Minimal re-renders
- Body scroll lock/unlock

## Browser Support

✅ Chrome/Edge (Chromium)
✅ Firefox
✅ Safari
✅ Mobile browsers
✅ Backdrop blur supported in all modern browsers

## Testing Checklist

- [ ] Dialog appears on delete click
- [ ] Backdrop dims the background
- [ ] Item name displays correctly
- [ ] Confirm button triggers deletion
- [ ] Cancel button closes dialog
- [ ] Click outside closes dialog
- [ ] Success toast shows after deletion
- [ ] Page scroll locks when open
- [ ] Animations are smooth
- [ ] Glassmorphism effect visible
- [ ] Buttons have proper colors
- [ ] Warning icon displays
- [ ] Responsive on mobile
