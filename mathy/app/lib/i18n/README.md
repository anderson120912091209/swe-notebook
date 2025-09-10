# Internationalization (i18n) System

This directory contains the scalable internationalization system for the Mathy application, supporting English and Traditional Chinese with easy extensibility for additional languages.

## 🏗️ Architecture

### Core Components

- **`translations/`** - Namespaced translation files organized by feature area
- **`LanguageContext.tsx`** - React Context provider for language management
- **`types.ts`** - Comprehensive TypeScript type definitions
- **`LanguageSwitcher.tsx`** - UI component for language selection

### Translation Namespaces

- **`common`** - Shared UI elements, actions, and messages
- **`navigation`** - Navigation links, breadcrumbs, and menu items
- **`marketing`** - Landing page, features, pricing, and marketing content
- **`auth`** - Authentication forms, validation messages, and user flows
- **`math`** - Math editor, symbols, and mathematical terminology

## 🚀 Usage

### Basic Translation

```tsx
import { useTranslation } from '../lib/i18n/LanguageContext';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('marketing', 'heroTitle')}</h1>
      <p>{t('common', 'welcome')}</p>
    </div>
  );
}
```

### Namespace-Specific Translation

```tsx
import { useNamespaceTranslation } from '../lib/i18n/LanguageContext';

function MarketingComponent() {
  const { t } = useNamespaceTranslation('marketing');
  
  return (
    <div>
      <h1>{t('heroTitle')}</h1>
      <p>{t('heroSubtitle')}</p>
    </div>
  );
}
```

### Language Switcher

```tsx
import LanguageSwitcher from '../components/LanguageSwitcher';

function Navigation() {
  return (
    <nav>
      <LanguageSwitcher />
    </nav>
  );
}
```

## 🔧 Features

### ✅ Implemented Features

- **Type Safety** - Full TypeScript support with autocomplete
- **Persistence** - Language preference saved in localStorage
- **Browser Detection** - Auto-detect user's preferred language
- **Namespace Organization** - Translations organized by feature area
- **React Context** - Centralized language state management
- **Formatting Utilities** - Number, date, and relative time formatting
- **RTL Support** - Ready for right-to-left languages (Arabic, Hebrew)

### 🎯 Language Support

- **English (en)** - Default language
- **Traditional Chinese (zh-TW)** - Full translation coverage

## 📁 File Structure

```
app/lib/i18n/
├── translations/
│   ├── index.ts          # Main translations export
│   ├── common.ts         # Common UI elements
│   ├── navigation.ts     # Navigation and menus
│   ├── marketing.ts      # Landing page and marketing
│   ├── auth.ts          # Authentication flows
│   └── math.ts          # Math editor and symbols
├── LanguageContext.tsx   # React Context provider
├── types.ts             # TypeScript definitions
└── README.md            # This documentation
```

## 🔄 Adding New Languages

### 1. Update Language Type

```typescript
// In types.ts
export type Language = 'en' | 'zh-TW' | 'ja' | 'ko';
```

### 2. Add Translations

```typescript
// In each translation file (e.g., common.ts)
export const common = {
  en: { /* existing translations */ },
  'zh-TW': { /* existing translations */ },
  ja: { /* Japanese translations */ },
  ko: { /* Korean translations */ },
} as const;
```

### 3. Update Language Options

```typescript
// In LanguageSwitcher.tsx
const languageOptions: LanguageOption[] = [
  // ... existing options
  {
    code: 'ja',
    name: 'Japanese',
    flag: '🇯🇵',
    nativeName: '日本語',
  },
  {
    code: 'ko',
    name: 'Korean',
    flag: '🇰🇷',
    nativeName: '한국어',
  },
];
```

## 🛠️ Development

### Adding New Translation Keys

1. **Add to appropriate namespace file** (e.g., `marketing.ts`)
2. **Provide translations for all supported languages**
3. **Use in components** with full type safety

```typescript
// In marketing.ts
export const marketing = {
  en: {
    newFeature: "New Feature",
    // ... other keys
  },
  'zh-TW': {
    newFeature: "新功能",
    // ... other keys
  },
} as const;
```

### Type Safety

The system provides full TypeScript support:

- **Autocomplete** for translation keys
- **Compile-time validation** of key existence
- **Type-safe** translation functions
- **Namespace isolation** prevents cross-contamination

### Validation

```typescript
// TypeScript will catch missing translations
const { t } = useNamespaceTranslation('marketing');
t('nonExistentKey'); // ❌ TypeScript error
t('heroTitle');      // ✅ Valid
```

## 🎨 Customization

### Language Switcher Variants

```tsx
// Default variant
<LanguageSwitcher />

// Compact variant
<LanguageSwitcherCompact />

// Custom styling
<LanguageSwitcher className="my-custom-class" />
```

### Formatting Options

```tsx
const { formatNumber, formatDate, formatRelativeTime } = useLanguage();

formatNumber(1234.56);        // "1,234.56" (en) / "1,234.56" (zh-TW)
formatDate(new Date());       // "January 1, 2024" (en) / "2024年1月1日" (zh-TW)
formatRelativeTime(date);     // "2 hours ago" (en) / "2小時前" (zh-TW)
```

## 🔍 Best Practices

### 1. Use Namespaces
Organize translations by feature area to maintain clarity and prevent conflicts.

### 2. Consistent Naming
Use descriptive, consistent key names:
- `heroTitle` ✅
- `title` ❌ (too generic)
- `hero_title` ❌ (inconsistent casing)

### 3. Context-Aware Translations
Provide context in translation keys when needed:
- `signInButton` vs `signUpButton`
- `deleteUser` vs `deletePost`

### 4. Fallback Handling
Always provide fallbacks for missing translations:
```tsx
const text = t('marketing', 'key') || 'Fallback text';
```

## 🚨 Troubleshooting

### Common Issues

1. **Missing Translation Key**
   - Check if key exists in the namespace file
   - Ensure key is added to all language variants

2. **TypeScript Errors**
   - Verify key spelling and namespace
   - Check if types are properly imported

3. **Language Not Persisting**
   - Check localStorage permissions
   - Verify LanguageProvider is wrapping the app

### Debug Mode

Enable debug logging by adding to your component:
```tsx
const { language, t } = useLanguage();
console.log('Current language:', language);
console.log('Translation result:', t('marketing', 'heroTitle'));
```

## 📈 Performance

- **Lazy Loading** - Translations loaded on demand
- **Memoization** - Context values are memoized
- **Tree Shaking** - Unused translations are eliminated
- **Type Safety** - Compile-time validation prevents runtime errors

## 🔮 Future Enhancements

- **Pluralization** - Support for complex plural rules
- **Interpolation** - Dynamic value insertion in translations
- **Translation Management** - External translation management system integration
- **A/B Testing** - Language-specific content variations
- **Analytics** - Translation usage tracking

---

For questions or contributions, please refer to the main project documentation or create an issue in the repository.
