# Products Filtering System - Comprehensive Analysis

## Current Implementation Overview

The products page uses a **client-side filtered approach** with multiple independent filtering systems:

### 1. PRIMARY FILTERING SYSTEM (ProductsClient.tsx)
**Location**: `/src/app/productos/ProductsClient.tsx`

#### Fetching Strategy:
- Fetches ALL products with stock (`/api/products?inStock=true&limit=1000`)
- All filtering happens CLIENT-SIDE using useMemo + useState
- Does NOT use URL parameters for filter state
- Products are fetched once on mount and cached

#### Available Filters:
1. **Search (Text)**: searchTerm (debounced 300ms)
   - Searches: name, brand, category, model, size_display
   - Case-insensitive
   
2. **Brand**: selectedBrand (dropdown)
   - Extracted from products dynamically
   - Shows count of available products per brand
   
3. **Category**: selectedCategory (dropdown)
   - Extracted from products dynamically
   - Shows count of available products per category
   
4. **Model**: selectedModel (dropdown)
   - Optional field from products
   - Shows count of available products per model
   
5. **Size Filters** (3 separate dropdowns):
   - Width (mm): selectedWidth (numbers like 185, 195, 205)
   - Profile (%): selectedProfile (numbers like 45, 55, 60, 65)
   - Diameter (inches): selectedDiameter (numbers like 15, 16, 17, 18)
   
6. **Smart Size Search**: sizeSearchTerm
   - Parses formats: "205/55R16", "205/55/16", "205-55-16"
   - Automatically sets width/profile/diameter filters
   - Shows top 10 size suggestions dynamically

#### Filter State Management:
```typescript
// All state in local component
const [searchTerm, setSearchTerm] = useState("")
const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
const [selectedBrand, setSelectedBrand] = useState("all")
const [selectedCategory, setSelectedCategory] = useState("all")
const [selectedModel, setSelectedModel] = useState("all")
const [selectedWidth, setSelectedWidth] = useState("all")
const [selectedProfile, setSelectedProfile] = useState("all")
const [selectedDiameter, setSelectedDiameter] = useState("all")
const [sortBy, setSortBy] = useState("name")
const [currentPage, setCurrentPage] = useState(1)
const [itemsPerPage, setItemsPerPage] = useState(50)
```

#### Filtering Logic:
- **Dependent Filtering**: Each filter shows only available values considering other filters
- **Dynamic Count Calculation**: Uses useMemo to calculate which options are available
- **Three separate filter chains**:
  1. For calculating brand options
  2. For calculating category options
  3. For calculating model options
- **Size filter dependencies**: width/profile/diameter affect each other
- **Search applies to all** filter calculations for context-aware counts

#### Sorting Options:
- Name (default)
- Price (ascending)
- Price (descending)
- Stock (highest first)

#### Pagination:
- 50 items per page (configurable: 10, 25, 50)
- Manual pagination controls with smart page number display
- Resets to page 1 when filters change

#### Special Features:
- **Equivalences Detection**: Shows tire equivalence section when all 3 size filters selected
- **Popular Size Buttons**: Quick preset buttons for common tire sizes
- **Size Suggestions**: Auto-completes based on available products
- **Mobile-Responsive**: Mobile filter drawer vs. desktop sidebar
- **Clear Filters Button**: One-click reset of all filters
- **Active Filter Badge**: Shows count of active filters on mobile

### 2. SECONDARY FILTERING SYSTEM (ProductGrid.tsx)
**Location**: `/src/features/products/catalog/ProductGrid.tsx`

#### State Management:
- Uses SessionStorage to persist filters between sessions
- Separate state objects per filter type
- Loads filter options on mount (brands, categories, sizes)

#### Filters Available:
- Search (text)
- Brand (dropdown)
- Category (dropdown)
- Size (combined dropdown showing "205/55R16" format)
- Max Price (number input)
- In Stock (checkbox)

#### Approach:
- HYBRID: Client-side rendering with server-side API calls
- Calls `getProducts()` API with filter parameters
- Paginates with 20 items per page
- Less sophisticated than ProductsClient

### 3. API ENDPOINT
**Location**: `/src/app/api/products/route.ts`

#### Supported Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 1000)
- `inStock`: Boolean flag (default: false)

#### Current Limitations:
- **ONLY supports `inStock` parameter** from URL query params
- Other filters (brand, category, size) are NOT handled by API
- All complex filtering is client-side

#### Behavior:
- Uses `getProducts()` from features/products/api.ts
- That function supports: search, brand, category, width, profile, diameter, minPrice, maxPrice, inStock
- But the API endpoint doesn't expose these parameters

## URL Parameter Handling

### Current State: ❌ NOT IMPLEMENTED
- ProductsClient does NOT use `useSearchParams()` to initialize filters
- `useSearchParams()` is imported but NOT used for reading initial filter state
- Filters reset on page reload
- No shareable URLs with filter parameters
- No browser history for filter changes

### The Missing Opportunity:
```typescript
// Currently NOT being used in ProductsClient:
const searchParams = useSearchParams()  // Imported but unused

// Should be reading:
// ?search=michelin&brand=Michelin&category=summer&width=205&profile=55&diameter=16&sort=price-asc&page=2
```

## Data Flow Architecture

```
┌─────────────────────────────────────┐
│   Page Load: /productos             │
└────────────┬────────────────────────┘
             │
             ├─→ ProductsClient mounts
             │   • Imports useSearchParams (UNUSED)
             │   • Initializes empty filter state
             │   • Makes API call: /api/products?inStock=true&limit=1000
             │
             ├─→ /api/products route
             │   • Parses URL query (only gets inStock, limit, page)
             │   • Calls getProducts() with basic filters
             │   • Returns filtered products
             │
             ├─→ Client-side processing:
             │   • All complex filtering in useMemo
             │   • Dependent filter calculations
             │   • Dynamic filter option counts
             │
             └─→ Render results
                 • Grid of products
                 • Pagination
                 • Equivalences section
```

## Product Model

```typescript
interface Product {
  id: string
  name: string
  brand: string
  model?: string
  category: string
  size?: string
  width?: number
  profile?: number
  diameter?: number
  load_index?: string
  speed_rating?: string
  price: number
  stock: number
  image_url?: string
  is_featured?: boolean
  size_display?: string
  created_at: string
  updated_at: string
}
```

## Key Observations

### Strengths:
✅ Client-side filtering is FAST (no server round-trips)
✅ Responsive dynamic filter options (dependent filtering)
✅ Good UX with popular size buttons and smart search
✅ Handles tire size parsing intelligently
✅ Mobile-responsive design with appropriate layouts
✅ Shows available counts per filter option
✅ Pagination works smoothly

### Weaknesses/Issues:
❌ **NO URL state persistence** - filters lost on reload
❌ **Filters NOT shareable** - can't send filtered links to users
❌ **No browser history** - back button doesn't restore filters
❌ **API endpoint underpowered** - doesn't support brand/category/size filtering
❌ **ProductGrid vs ProductsClient mismatch** - two different filtering systems
❌ **Scalability issue** - fetching all 1000 products to client
❌ **No deep linking** - can't link directly to specific filter combinations
❌ **Mobile performance** - large dataset on mobile might be slow
❌ **useSearchParams imported but unused** - suggests incomplete implementation

### Unused Code:
- `const searchParams = useSearchParams()` in ProductsClient is imported but never called
- Indicates the system was PLANNED to support URL params but not implemented

## Recommendation for URL Parameter Implementation

The foundation is there:
1. `useSearchParams()` is already imported
2. All filter state variables exist
3. Dynamic rendering already responds to state changes

To implement URL persistence, would need:
1. Read URL params on mount
2. Update URL params when filters change
3. Sync URL state with component state bidirectionally
4. Handle browser back/forward navigation
5. Encode/decode complex filter objects for URL

Example URL structure:
```
/productos?search=michelin&brand=Michelin&category=summer&width=205&profile=55&diameter=16&sort=price-asc&page=2&items=50
```
