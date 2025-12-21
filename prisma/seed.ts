import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, Status } from "../lib/generated/prisma/client";
import { hashPassword } from "better-auth/crypto";
import { v4 as uuid } from "uuid";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data (in reverse dependency order)
  await db.assignment.deleteMany();
  await db.feature.deleteMany();
  await db.project.deleteMany();
  await db.orgMember.deleteMany();
  await db.user.update({
    where: { email: "admin@demo.com" },
    data: { batchId: null },
  }).catch(() => {});
  await db.batch.deleteMany();
  await db.customOrg.deleteMany();
  await db.member.deleteMany();
  await db.organization.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  console.log("✓ Cleaned existing data");

  // Create password hash using Better Auth's scrypt algorithm
  const passwordHash = await hashPassword("password123");

  // ============================================
  // CREATE DEMO ORGANIZATION
  // ============================================

  const demoOrg = await db.customOrg.create({
    data: {
      id: uuid(),
      name: "Demo Academy",
      slug: "demo-academy",
      logo: null,
    },
  });

  // Also create in Better Auth organization table
  const betterAuthOrg = await db.organization.create({
    data: {
      id: demoOrg.id, // Use same ID for linking
      name: "Demo Academy",
      slug: "demo-academy",
      logo: null,
    },
  });

  console.log("✓ Created demo organization:", demoOrg.slug);

  // ============================================
  // CREATE BATCHES
  // ============================================

  const batch2024A = await db.batch.create({
    data: {
      id: uuid(),
      name: "Batch 2024-A",
      slug: "batch-2024-a",
      orgId: demoOrg.id,
    },
  });

  const batch2024B = await db.batch.create({
    data: {
      id: uuid(),
      name: "Batch 2024-B",
      slug: "batch-2024-b",
      orgId: demoOrg.id,
    },
  });

  console.log("✓ Created batches:", batch2024A.slug, batch2024B.slug);

  // ============================================
  // CREATE USERS
  // ============================================

  // Admin user
  const adminUser = await db.user.create({
    data: {
      id: uuid(),
      name: "Admin User",
      email: "admin@demo.com",
      emailVerified: true,
      role: "Admin",
      image: null,
    },
  });

  await db.account.create({
    data: {
      id: uuid(),
      userId: adminUser.id,
      accountId: adminUser.id,
      providerId: "credential",
      password: passwordHash,
    },
  });

  // PM user
  const pmUser = await db.user.create({
    data: {
      id: uuid(),
      name: "Project Manager",
      email: "pm@demo.com",
      emailVerified: true,
      role: "PM",
      image: null,
    },
  });

  await db.account.create({
    data: {
      id: uuid(),
      userId: pmUser.id,
      accountId: pmUser.id,
      providerId: "credential",
      password: passwordHash,
    },
  });

  // Students in Batch 2024-A
  const student1 = await db.user.create({
    data: {
      id: uuid(),
      name: "Alice Johnson",
      email: "alice@demo.com",
      emailVerified: true,
      role: "Student",
      batchId: batch2024A.id,
      image: null,
    },
  });

  await db.account.create({
    data: {
      id: uuid(),
      userId: student1.id,
      accountId: student1.id,
      providerId: "credential",
      password: passwordHash,
    },
  });

  const student2 = await db.user.create({
    data: {
      id: uuid(),
      name: "Bob Smith",
      email: "bob@demo.com",
      emailVerified: true,
      role: "Student",
      batchId: batch2024A.id,
      image: null,
    },
  });

  await db.account.create({
    data: {
      id: uuid(),
      userId: student2.id,
      accountId: student2.id,
      providerId: "credential",
      password: passwordHash,
    },
  });

  // Students in Batch 2024-B
  const student3 = await db.user.create({
    data: {
      id: uuid(),
      name: "Carol Williams",
      email: "carol@demo.com",
      emailVerified: true,
      role: "Student",
      batchId: batch2024B.id,
      image: null,
    },
  });

  await db.account.create({
    data: {
      id: uuid(),
      userId: student3.id,
      accountId: student3.id,
      providerId: "credential",
      password: passwordHash,
    },
  });

  const student4 = await db.user.create({
    data: {
      id: uuid(),
      name: "David Brown",
      email: "david@demo.com",
      emailVerified: true,
      role: "Student",
      batchId: batch2024B.id,
      image: null,
    },
  });

  await db.account.create({
    data: {
      id: uuid(),
      userId: student4.id,
      accountId: student4.id,
      providerId: "credential",
      password: passwordHash,
    },
  });

  console.log("✓ Created users: admin, pm, alice, bob, carol, david");

  // ============================================
  // CREATE ORG MEMBERSHIPS
  // ============================================

  // Add all users to demo org
  const users = [adminUser, pmUser, student1, student2, student3, student4];
  const roles = ["Admin", "PM", "Student", "Student", "Student", "Student"];

  for (let i = 0; i < users.length; i++) {
    // CustomOrg membership
    await db.orgMember.create({
      data: {
        id: uuid(),
        userId: users[i].id,
        orgId: demoOrg.id,
        role: roles[i],
      },
    });

    // Better Auth organization membership
    await db.member.create({
      data: {
        id: uuid(),
        userId: users[i].id,
        organizationId: betterAuthOrg.id,
        role: roles[i].toLowerCase(),
      },
    });
  }

  console.log("✓ Created org memberships");

  // ============================================
  // CREATE PROJECTS
  // ============================================

  const project1 = await db.project.create({
    data: {
      id: uuid(),
      name: "E-Commerce Platform",
      description:
        "Build a full-stack e-commerce application with product catalog, shopping cart, checkout functionality, and integrated payment processing.",
      orgId: demoOrg.id,
      createdBy: pmUser.id,
      shareId: uuid(),
    },
  });

  const project2 = await db.project.create({
    data: {
      id: uuid(),
      name: "Healthcare Management System",
      description:
        "Develop a comprehensive healthcare management system for patient records, appointment scheduling, medical history tracking, and HIPAA-compliant data storage.",
      orgId: demoOrg.id,
      createdBy: pmUser.id,
      shareId: uuid(),
    },
  });

  const project3 = await db.project.create({
    data: {
      id: uuid(),
      name: "Social Media Dashboard",
      description:
        "Create a real-time social media analytics dashboard with content feeds, engagement tracking, sentiment analysis, and multi-platform integration.",
      orgId: demoOrg.id,
      createdBy: pmUser.id,
      shareId: uuid(),
    },
  });

  const project4 = await db.project.create({
    data: {
      id: uuid(),
      name: "Financial Analytics Platform",
      description:
        "Build a financial analytics platform with data visualization, custom reporting, real-time market data, and portfolio tracking capabilities.",
      orgId: demoOrg.id,
      createdBy: pmUser.id,
      shareId: uuid(),
    },
  });

  const project5 = await db.project.create({
    data: {
      id: uuid(),
      name: "Learning Management System",
      description:
        "Develop an educational platform with course management, student enrollment, assignment submission, grading workflows, and progress tracking.",
      orgId: demoOrg.id,
      createdBy: pmUser.id,
      shareId: uuid(),
    },
  });

  console.log("✓ Created projects:", project1.name, project2.name, project3.name, project4.name, project5.name);

  // ============================================
  // CREATE FEATURES
  // ============================================

  // Store all features for assignment distribution
  const allFeatures = [];

  // ========== PROJECT 1: E-COMMERCE PLATFORM ==========

  const ecom1 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project1.id,
      title: "User Authentication & Authorization",
      description: `## Overview
Implement a comprehensive authentication system supporting multiple login methods, secure session management, and role-based access control for customers and administrators.

## User Stories
- As a new customer, I want to create an account with email/password so that I can make purchases and track orders
- As a returning customer, I want to log in using Google or GitHub so that I don't need to remember another password
- As an admin, I want to manage user roles and permissions so that I can control access to sensitive features

## Functional Requirements
1. The system shall support email/password registration with password strength validation (min 8 chars, uppercase, number, special char)
2. The system shall implement OAuth 2.0 integration for Google and GitHub providers
3. The system must provide password reset functionality via time-limited email verification links
4. The application should send email verification on new account creation with 24-hour expiration
5. The system shall implement JWT-based session management with 7-day access tokens and 30-day refresh tokens
6. The system must provide route middleware to protect customer dashboard and admin pages

## Technical Requirements
- **Stack**: React (frontend), Node.js + Express (backend), Better Auth library
- **Database**: PostgreSQL - User, Account, Session, Verification tables with indexes on email and userId
- **APIs**: POST /auth/signup, POST /auth/login, POST /auth/logout, GET /auth/session, POST /auth/reset-password
- **Security**: bcrypt password hashing (10 rounds), HTTP-only cookies, CSRF tokens, rate limiting (5 attempts per 15min)
- **Performance**: Session validation < 50ms, OAuth redirect < 2s, email delivery < 5s

## Acceptance Criteria
- [ ] Users can register with email/password and receive verification email
- [ ] Users can log in with Google or GitHub OAuth with account linking
- [ ] Password reset flow works end-to-end with secure token validation
- [ ] Protected routes redirect unauthenticated users to login page
- [ ] Session persists across browser refresh and expires after 7 days of inactivity
- [ ] All authentication endpoints are rate-limited to prevent brute force attacks

## Dependencies
- None (foundational feature)

## Estimated Complexity
**High** - Requires integration with multiple OAuth providers, secure token handling, email service configuration, and comprehensive security measures including CSRF protection and rate limiting.`,
      tags: ["auth", "backend", "security", "api", "oauth"],
    },
  });
  allFeatures.push(ecom1);

  const ecom2 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project1.id,
      title: "Product Catalog Management",
      description: `## Overview
Build a comprehensive product catalog system with advanced search, filtering, categorization, and multi-image support for effective product browsing and discovery.

## User Stories
- As a customer, I want to browse products by category so that I can find items I'm interested in quickly
- As a customer, I want to search for products by name or description so that I can find specific items
- As an admin, I want to manage product listings with images and variants so that customers see accurate information

## Functional Requirements
1. The system shall display products in a grid layout with pagination (24 products per page)
2. The system shall provide category-based navigation with hierarchical categories (parent/child relationships)
3. The system must implement full-text search across product names, descriptions, and SKUs
4. The application should support product variants (size, color) with independent pricing and inventory
5. The system shall display product images in a gallery with zoom functionality (up to 8 images per product)
6. The system must show real-time stock availability and out-of-stock indicators

## Technical Requirements
- **Stack**: React + TypeScript (frontend), Next.js API routes (backend), ElasticSearch or PostgreSQL full-text search
- **Database**: Product, Category, ProductImage, ProductVariant tables with full-text indexes
- **APIs**: GET /products, GET /products/:id, GET /categories, GET /products/search?q=keyword
- **Security**: Input sanitization for search queries, SQL injection prevention
- **Performance**: Product list load < 1s, search results < 500ms, image optimization (WebP format, lazy loading)

## Acceptance Criteria
- [ ] Product listing page displays 24 products per page with working pagination
- [ ] Category filter updates product list without full page reload
- [ ] Search returns relevant results within 500ms
- [ ] Product detail page shows all images with gallery navigation
- [ ] Variant selection updates price and stock status in real-time
- [ ] Out-of-stock products are clearly marked but still viewable

## Dependencies
- User Authentication (for admin product management)

## Estimated Complexity
**High** - Requires complex database queries with full-text search, image optimization pipeline, variant management logic, and performant pagination with filtering.`,
      tags: ["frontend", "api", "database", "search", "ui"],
    },
  });
  allFeatures.push(ecom2);

  const ecom3 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project1.id,
      title: "Shopping Cart & Wishlist",
      description: `## Overview
Implement a persistent shopping cart and wishlist system with real-time price calculations, quantity management, and synchronization across devices for authenticated users.

## User Stories
- As a customer, I want to add products to my cart so that I can purchase multiple items at once
- As a customer, I want my cart to persist across sessions so that I don't lose my selections
- As a customer, I want to save items to a wishlist so that I can purchase them later

## Functional Requirements
1. The system shall allow adding products to cart with quantity selection (1-99 units)
2. The system shall persist cart data in localStorage for guests and database for authenticated users
3. The system must synchronize cart contents between devices for logged-in users
4. The application should display real-time cart totals including subtotal, tax, and shipping estimates
5. The system shall support discount code application with percentage or fixed-amount discounts
6. The system must provide a wishlist feature with move-to-cart functionality

## Technical Requirements
- **Stack**: React Context API or Redux (state management), REST API (backend)
- **Database**: Cart, CartItem, Wishlist, WishlistItem tables with userId foreign keys
- **APIs**: POST /cart/add, PUT /cart/update, DELETE /cart/remove, POST /cart/apply-discount, GET /wishlist
- **Security**: Cart ownership validation, discount code verification
- **Performance**: Cart updates < 200ms, cart-database sync on login < 1s

## Acceptance Criteria
- [ ] Adding product to cart updates cart icon badge immediately
- [ ] Cart persists after browser refresh for both guest and authenticated users
- [ ] Quantity updates recalculate totals in real-time
- [ ] Valid discount codes apply correctly and invalid codes show error messages
- [ ] Wishlist items display with quick "add to cart" button
- [ ] Cart syncs across devices when user logs in on different browser

## Dependencies
- Product Catalog (to retrieve product data)
- User Authentication (for cart synchronization)

## Estimated Complexity
**Medium** - Requires state management architecture, localStorage and database synchronization logic, real-time price calculation with tax/shipping/discounts, and cross-device sync implementation.`,
      tags: ["frontend", "state-management", "api", "database"],
    },
  });
  allFeatures.push(ecom3);

  const ecom4 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project1.id,
      title: "Checkout & Payment Processing",
      description: `## Overview
Build a secure multi-step checkout flow with address management, payment processing via Stripe, order confirmation, and automated email notifications.

## User Stories
- As a customer, I want a simple checkout process so that I can complete my purchase quickly
- As a customer, I want to pay securely with credit card so that my financial information is protected
- As a customer, I want to receive order confirmation so that I have proof of purchase

## Functional Requirements
1. The system shall implement a 3-step checkout flow: Shipping → Payment → Review
2. The system shall validate shipping address using address verification API (e.g., SmartyStreets)
3. The system must integrate Stripe payment processing with support for credit/debit cards
4. The application should calculate real-time shipping costs based on destination and package weight
5. The system shall generate order confirmation with unique order number upon successful payment
6. The system must send order confirmation email with receipt PDF attachment within 1 minute

## Technical Requirements
- **Stack**: React multi-step form (Formik), Node.js + Express (backend), Stripe SDK
- **Database**: Order, OrderItem, ShippingAddress tables with transaction logging
- **APIs**: POST /checkout/validate-address, POST /checkout/calculate-shipping, POST /checkout/create-payment-intent, POST /checkout/confirm
- **Security**: PCI compliance via Stripe, HTTPS-only, server-side payment verification, no card data storage
- **Performance**: Address validation < 1s, payment processing < 3s, email delivery < 1min

## Acceptance Criteria
- [ ] Checkout form validates shipping address and shows suggestions for invalid addresses
- [ ] Payment form displays real-time validation errors for card number, expiry, CVV
- [ ] Successful payment creates order record and reduces product inventory
- [ ] Order confirmation page displays order number, items, total, and estimated delivery
- [ ] Confirmation email arrives within 1 minute with PDF receipt attachment
- [ ] Failed payments show clear error messages without losing form data

## Dependencies
- Shopping Cart (checkout requires cart data)
- User Authentication (optional - guest checkout supported)

## Estimated Complexity
**High** - Requires Stripe integration with webhook handling, address validation API integration, multi-step form state management, transactional email system, and PDF generation for receipts.`,
      tags: ["payments", "backend", "integration", "api", "security"],
    },
  });
  allFeatures.push(ecom4);

  const ecom5 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project1.id,
      title: "Order Management Dashboard",
      description: `## Overview
Create a customer-facing order management dashboard displaying order history, status tracking, invoice downloads, and return/refund request functionality.

## User Stories
- As a customer, I want to view my order history so that I can track past purchases
- As a customer, I want to see real-time order status so that I know when to expect delivery
- As a customer, I want to download invoices so that I have records for accounting

## Functional Requirements
1. The system shall display paginated order history with filters by date range and status
2. The system shall show order status with visual timeline (Ordered → Processing → Shipped → Delivered)
3. The system must provide downloadable PDF invoices for all completed orders
4. The application should display tracking numbers with links to carrier tracking pages
5. The system shall allow customers to initiate return requests for orders within 30 days
6. The system must send email notifications for order status changes

## Technical Requirements
- **Stack**: React table component (TanStack Table), PDF generation library (PDFKit or jsPDF)
- **Database**: Order table with status enum, OrderStatusHistory for timeline tracking
- **APIs**: GET /orders, GET /orders/:id, GET /orders/:id/invoice, POST /orders/:id/return
- **Security**: Order ownership verification, secure PDF URL generation with expiration
- **Performance**: Order list load < 800ms, PDF generation < 2s, real-time status updates via WebSocket

## Acceptance Criteria
- [ ] Order history displays all orders with correct date, total, and status
- [ ] Status timeline shows visual progress with timestamps for each stage
- [ ] Invoice PDF downloads with all order details, tax breakdown, and payment method
- [ ] Tracking links open carrier websites with tracking number pre-filled
- [ ] Return request form validates reason and captures item condition notes
- [ ] Email notifications sent when order status changes (shipped, delivered, etc.)

## Dependencies
- User Authentication (to retrieve user orders)
- Checkout & Payment Processing (creates orders)

## Estimated Complexity
**Medium** - Requires PDF generation, timeline visualization component, email notification system integration, and return request workflow with validation.`,
      tags: ["frontend", "api", "ui", "backend", "pdf"],
    },
  });
  allFeatures.push(ecom5);

  const ecom6 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project1.id,
      title: "Product Reviews & Ratings",
      description: `## Overview
Implement a product review system with star ratings, verified purchase badges, image uploads, helpful voting, and moderation tools for quality control.

## User Stories
- As a customer, I want to read product reviews so that I can make informed purchase decisions
- As a verified buyer, I want to leave reviews so that I can share my experience with others
- As a customer, I want to upload photos with reviews so that others can see real product images

## Functional Requirements
1. The system shall allow verified purchasers to submit reviews with 1-5 star ratings
2. The system shall support review text (50-5000 characters) with optional photo uploads (up to 5 images)
3. The system must display average rating and rating distribution histogram on product pages
4. The application should allow customers to mark reviews as helpful (upvote/downvote)
5. The system shall sort reviews by most helpful, newest, highest rating, or lowest rating
6. The system must provide admin moderation tools to flag/remove inappropriate reviews

## Technical Requirements
- **Stack**: React star rating component, image upload with preview, Node.js backend
- **Database**: Review, ReviewImage tables with foreign keys to Product and User, indexes on productId
- **APIs**: POST /products/:id/reviews, GET /products/:id/reviews, PUT /reviews/:id/helpful, DELETE /reviews/:id (admin)
- **Security**: Verified purchase validation, image file type/size limits (5MB max), profanity filter
- **Performance**: Review list pagination (10 per page), image optimization (thumbnail generation), average rating calculation via database aggregation

## Acceptance Criteria
- [ ] Only verified purchasers can submit reviews (badge displayed on review)
- [ ] Review form validates text length and allows up to 5 image uploads
- [ ] Product page displays accurate average rating and rating breakdown chart
- [ ] Helpful votes update in real-time and affect review sorting order
- [ ] Admin can flag reviews as inappropriate and hide them from public view
- [ ] Review submission triggers email to product owner (if applicable)

## Dependencies
- User Authentication (to verify review authorship)
- Order Management (to verify purchase status)

## Estimated Complexity
**Medium** - Requires image upload and storage, rating aggregation queries, helpful voting system, moderation workflow, and verified purchase badge logic.`,
      tags: ["frontend", "backend", "api", "ui", "moderation"],
    },
  });
  allFeatures.push(ecom6);

  const ecom7 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project1.id,
      title: "Inventory Management System",
      description: `## Overview
Develop an admin inventory management system with stock tracking, low-stock alerts, bulk import/export, product variant inventory, and purchase order management.

## User Stories
- As an admin, I want to track inventory levels so that I can prevent overselling
- As an admin, I want to receive low-stock alerts so that I can reorder products in time
- As an admin, I want to bulk import products so that I can add inventory efficiently

## Functional Requirements
1. The system shall track inventory levels per product variant with real-time updates on sales
2. The system shall send email alerts when inventory falls below configurable threshold (e.g., 10 units)
3. The system must support bulk product import via CSV with validation and error reporting
4. The application should provide bulk export of inventory data in CSV format
5. The system shall maintain inventory history log with timestamp and reason (sale, return, adjustment)
6. The system must prevent overselling by reserving inventory during checkout process

## Technical Requirements
- **Stack**: React admin panel, CSV parser (PapaParse), Node.js backend with queue processing (Bull/Redis)
- **Database**: Inventory, InventoryLog tables with triggers for automatic logging, indexes on SKU
- **APIs**: GET /admin/inventory, PUT /admin/inventory/:id, POST /admin/inventory/import, GET /admin/inventory/export
- **Security**: Admin-only access, input validation for CSV imports, transaction locks to prevent race conditions
- **Performance**: Bulk import processing 1000 products/min, real-time inventory updates < 100ms

## Acceptance Criteria
- [ ] Inventory page displays current stock levels with visual low-stock indicators
- [ ] Email alert sent when stock falls below threshold with product details
- [ ] CSV import validates all rows and shows detailed error report for invalid data
- [ ] Export generates CSV with all inventory data including variant details
- [ ] Inventory log displays all changes with user, timestamp, and reason
- [ ] Overselling prevented by inventory reservation during checkout with 15min timeout

## Dependencies
- Product Catalog (inventory linked to products)
- Checkout & Payment Processing (inventory updates on sale)

## Estimated Complexity
**High** - Requires CSV import/export with validation, background job processing, low-stock alerting system, inventory reservation logic with timeout, and detailed audit logging.`,
      tags: ["backend", "api", "database", "admin", "csv"],
    },
  });
  allFeatures.push(ecom7);

  const ecom8 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project1.id,
      title: "Promotional Campaigns & Coupons",
      description: `## Overview
Build a promotional campaign system with coupon code generation, discount rules, usage limits, expiration dates, and analytics tracking for marketing effectiveness.

## User Stories
- As a marketer, I want to create coupon codes so that I can run promotional campaigns
- As a customer, I want to apply discount codes so that I can save money on purchases
- As a marketer, I want to track coupon usage so that I can measure campaign effectiveness

## Functional Requirements
1. The system shall allow admins to create coupons with percentage or fixed-amount discounts
2. The system shall support coupon restrictions (minimum purchase, specific categories, first-time users only)
3. The system must enforce usage limits (total uses, per-customer uses, expiration dates)
4. The application should generate unique coupon codes automatically or allow custom codes
5. The system shall display active promotions on homepage with banner images
6. The system must track coupon usage analytics (redemption rate, revenue impact, customer acquisition)

## Technical Requirements
- **Stack**: React admin panel for coupon creation, banner carousel component
- **Database**: Coupon, CouponUsage tables with indexes on code and userId, triggers for usage counting
- **APIs**: POST /admin/coupons, PUT /admin/coupons/:id, POST /cart/apply-coupon, GET /admin/coupons/analytics
- **Security**: Coupon code uniqueness validation, usage limit enforcement with database locks
- **Performance**: Coupon validation < 100ms, analytics aggregation using materialized views

## Acceptance Criteria
- [ ] Admin can create coupons with discount type, amount, and restrictions
- [ ] Coupon validation rejects expired, over-limit, or invalid codes with specific error messages
- [ ] Cart applies discount correctly based on coupon rules and restrictions
- [ ] Homepage banner displays active promotions with click tracking
- [ ] Analytics dashboard shows coupon usage metrics with charts (redemption over time)
- [ ] Per-customer usage limits enforced (e.g., one use per customer for WELCOME10 code)

## Dependencies
- Shopping Cart (coupon application during checkout)
- User Authentication (for per-customer usage tracking)

## Estimated Complexity
**Medium** - Requires coupon validation engine with complex rule evaluation, usage tracking with concurrency handling, analytics aggregation, and promotional banner management.`,
      tags: ["backend", "api", "marketing", "analytics", "admin"],
    },
  });
  allFeatures.push(ecom8);

  const ecom9 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project1.id,
      title: "Email Marketing Integration",
      description: `## Overview
Integrate email marketing platform (Mailchimp or SendGrid) with automated campaigns for abandoned carts, order confirmations, promotional newsletters, and customer segmentation.

## User Stories
- As a marketer, I want to send newsletters so that I can engage customers with new products
- As a customer, I want to receive cart abandonment reminders so that I don't forget my intended purchases
- As an admin, I want to segment customers so that I can send targeted campaigns

## Functional Requirements
1. The system shall integrate with Mailchimp or SendGrid API for email campaign management
2. The system shall automatically send cart abandonment emails after 1 hour, 24 hours, and 3 days
3. The system must sync customer data to email platform with segmentation (purchase history, preferences)
4. The application should provide email templates for order confirmation, shipping updates, and promotions
5. The system shall track email engagement metrics (open rate, click rate, conversions)
6. The system must allow customers to manage email preferences and unsubscribe

## Technical Requirements
- **Stack**: Node.js backend, Mailchimp/SendGrid SDK, scheduled jobs (cron or queue system)
- **Database**: EmailCampaign, EmailLog tables for tracking sent emails and engagement
- **APIs**: POST /admin/campaigns, GET /admin/campaigns/analytics, PUT /users/email-preferences
- **Security**: Email preference encryption, double opt-in for newsletter subscriptions
- **Performance**: Batch email sending (500 emails/batch), abandoned cart detection via scheduled job every hour

## Acceptance Criteria
- [ ] New customers automatically added to email list with welcome email sent within 5 minutes
- [ ] Cart abandonment emails sent at correct intervals with dynamic cart contents
- [ ] Customer segments created based on purchase history (VIP, inactive, first-time buyers)
- [ ] Email templates render correctly across major email clients (Gmail, Outlook, Apple Mail)
- [ ] Analytics dashboard displays campaign metrics with conversion tracking
- [ ] Unsubscribe link works and removes customer from all marketing emails

## Dependencies
- Shopping Cart (for abandoned cart detection)
- Order Management (for transactional emails)

## Estimated Complexity
**Medium** - Requires email platform API integration, scheduled job system for automation, customer segmentation logic, email template design, and engagement tracking implementation.`,
      tags: ["integration", "backend", "marketing", "api", "automation"],
    },
  });
  allFeatures.push(ecom9);

  const ecom10 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project1.id,
      title: "Analytics & Reporting Dashboard",
      description: `## Overview
Create a comprehensive analytics dashboard with sales reports, customer insights, product performance metrics, revenue forecasting, and exportable reports for business intelligence.

## User Stories
- As an admin, I want to view sales trends so that I can make data-driven business decisions
- As a marketer, I want to see customer acquisition metrics so that I can optimize campaigns
- As a manager, I want to export reports so that I can share insights with stakeholders

## Functional Requirements
1. The system shall display daily/weekly/monthly sales charts with revenue and order count trends
2. The system shall provide customer analytics (new vs returning, lifetime value, churn rate)
3. The system must show product performance metrics (best sellers, low performers, inventory turnover)
4. The application should calculate key metrics (AOV, conversion rate, cart abandonment rate)
5. The system shall support custom date range selection and comparison with previous periods
6. The system must allow report exports in PDF and CSV formats

## Technical Requirements
- **Stack**: React + Chart.js or Recharts, Node.js API with aggregation queries
- **Database**: Materialized views for pre-aggregated metrics, indexes on date columns for performance
- **APIs**: GET /admin/analytics/sales, GET /admin/analytics/customers, GET /admin/analytics/products, POST /admin/analytics/export
- **Security**: Admin-only access, rate limiting on export endpoints
- **Performance**: Dashboard load < 2s, aggregation queries optimized with indexes, caching for frequently accessed metrics

## Acceptance Criteria
- [ ] Sales chart displays accurate revenue and order counts by selected time period
- [ ] Customer metrics show new vs returning breakdown with percentages
- [ ] Best sellers list ranks products by revenue with units sold
- [ ] Key metrics (AOV, conversion rate) update in real-time when date range changes
- [ ] Period comparison shows percentage change vs previous period (e.g., vs last month)
- [ ] Exported reports contain all dashboard data in readable format

## Dependencies
- Order Management (sales data source)
- Product Catalog (product performance data)

## Estimated Complexity
**High** - Requires complex aggregation queries, data visualization library integration, materialized views for performance, report export with formatting, and real-time metric calculations.`,
      tags: ["analytics", "backend", "api", "visualization", "reporting"],
    },
  });
  allFeatures.push(ecom10);

  // ========== PROJECT 2: HEALTHCARE MANAGEMENT SYSTEM ==========

  const health1 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project2.id,
      title: "Patient Registration & Records",
      description: `## Overview
Develop a secure patient registration system with comprehensive medical history tracking, HIPAA-compliant data storage, and document upload capabilities.

## User Stories
- As a receptionist, I want to register new patients so that their information is available for appointments
- As a doctor, I want to access patient medical history so that I can make informed treatment decisions
- As a patient, I want to update my contact information so that the clinic can reach me

## Functional Requirements
1. The system shall capture patient demographics (name, DOB, gender, contact, insurance)
2. The system shall maintain medical history including allergies, medications, chronic conditions, and family history
3. The system must support document uploads (insurance cards, medical records) with 20MB file size limit
4. The application should track patient visits with timestamp and provider information
5. The system shall implement patient search by name, DOB, patient ID, or phone number
6. The system must maintain audit log of all access to patient records for compliance

## Technical Requirements
- **Stack**: React forms with validation, Node.js + Express backend, encrypted file storage (S3 with server-side encryption)
- **Database**: Patient, MedicalHistory, Document tables with encryption at rest, indexes on searchable fields
- **APIs**: POST /patients, GET /patients/:id, PUT /patients/:id, POST /patients/:id/documents, GET /patients/search
- **Security**: HIPAA compliance (encryption in transit and at rest, access logging, role-based access), PHI data masking
- **Performance**: Patient search < 500ms, document upload < 5s for 10MB file

## Acceptance Criteria
- [ ] Registration form validates all required fields (name, DOB, contact)
- [ ] Medical history section captures allergies with severity levels
- [ ] Document upload supports PDF, JPG, PNG formats with virus scanning
- [ ] Patient search returns results ranked by relevance within 500ms
- [ ] All access to patient records logged with user ID, timestamp, and action
- [ ] Insurance information stored with encryption and masked in UI (last 4 digits visible)

## Dependencies
- User Authentication (with role-based access for doctors, nurses, admins)

## Estimated Complexity
**High** - Requires HIPAA compliance implementation including encryption, audit logging, access controls, secure file storage, and comprehensive data validation for medical information.`,
      tags: ["backend", "security", "database", "api", "compliance"],
    },
  });
  allFeatures.push(health1);

  const health2 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project2.id,
      title: "Appointment Scheduling System",
      description: `## Overview
Build an appointment scheduling system with calendar views, provider availability management, automated reminders, and conflict prevention.

## User Stories
- As a patient, I want to book appointments online so that I don't need to call the clinic
- As a receptionist, I want to view doctor availability so that I can schedule appointments efficiently
- As a doctor, I want to set my available hours so that appointments are only booked when I'm free

## Functional Requirements
1. The system shall display provider availability in calendar view (day, week, month)
2. The system shall prevent double-booking and enforce appointment duration minimums
3. The system must send appointment reminders via email 24 hours and SMS 2 hours before appointment
4. The application should support recurring appointments (weekly, monthly) with series management
5. The system shall allow appointment cancellation with configurable notice period (e.g., 24 hours)
6. The system must track appointment status (scheduled, checked-in, in-progress, completed, cancelled)

## Technical Requirements
- **Stack**: React calendar component (FullCalendar), Node.js backend, Twilio for SMS
- **Database**: Appointment, ProviderSchedule tables with unique constraints to prevent double-booking
- **APIs**: POST /appointments, GET /appointments/availability, PUT /appointments/:id/cancel, GET /providers/:id/schedule
- **Security**: Patient data access controls, appointment ownership verification
- **Performance**: Availability query < 300ms, reminder job processes 1000 appointments/min

## Acceptance Criteria
- [ ] Calendar displays provider availability with booked slots marked
- [ ] Booking form prevents selection of unavailable time slots
- [ ] Email reminder sent 24 hours before appointment with confirmation link
- [ ] SMS reminder sent 2 hours before with clinic address and phone
- [ ] Recurring appointment series can be edited (single or all occurrences)
- [ ] Cancellation requires confirmation and triggers notification to provider

## Dependencies
- Patient Registration (appointments linked to patients)
- User Authentication (provider schedules)

## Estimated Complexity
**High** - Requires complex availability calculation with conflict detection, recurring appointment logic, reminder scheduling system with SMS/email integration, and calendar UI implementation.`,
      tags: ["frontend", "backend", "api", "integration", "ui"],
    },
  });
  allFeatures.push(health2);

  const health3 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project2.id,
      title: "Electronic Health Records (EHR)",
      description: `## Overview
Implement a comprehensive EHR system with clinical notes, diagnosis coding (ICD-10), treatment plans, prescription management, and lab result integration.

## User Stories
- As a doctor, I want to document clinical notes so that patient visits are properly recorded
- As a nurse, I want to record vital signs so that patient health is tracked over time
- As a doctor, I want to prescribe medications electronically so that prescriptions are sent to pharmacies automatically

## Functional Requirements
1. The system shall provide structured clinical note templates (SOAP format: Subjective, Objective, Assessment, Plan)
2. The system shall support ICD-10 diagnosis code search and association with patient encounters
3. The system must record vital signs (BP, HR, temp, weight, height) with normal range warnings
4. The application should allow electronic prescription creation with drug interaction checking
5. The system shall integrate with lab systems to import test results with critical value alerts
6. The system must maintain complete encounter history with provider signature and timestamp

## Technical Requirements
- **Stack**: React rich text editor (ProseMirror), Node.js backend, external APIs (drug database, lab integration)
- **Database**: Encounter, ClinicalNote, VitalSign, Prescription, LabResult tables with patient foreign keys
- **APIs**: POST /encounters, POST /encounters/:id/notes, POST /prescriptions, GET /icd10/search, POST /lab-results/import
- **Security**: Provider-only access to EHR functionality, digital signatures for prescriptions, audit logging for all modifications
- **Performance**: ICD-10 search autocomplete < 200ms, encounter save < 500ms, lab result import batch processing

## Acceptance Criteria
- [ ] Clinical note template includes SOAP sections with rich text formatting
- [ ] ICD-10 code search provides autocomplete with code descriptions
- [ ] Vital signs entry shows warnings when values outside normal range
- [ ] Prescription form checks drug interactions and displays warnings
- [ ] Lab results display with critical values highlighted in red
- [ ] Encounter locked after provider signature with edit history preserved

## Dependencies
- Patient Registration (EHR linked to patients)
- User Authentication (provider roles)

## Estimated Complexity
**High** - Requires complex medical data modeling, ICD-10 database integration, drug interaction API integration, lab system integration, digital signature implementation, and comprehensive validation.`,
      tags: ["backend", "api", "database", "integration", "compliance"],
    },
  });
  allFeatures.push(health3);

  const health4 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project2.id,
      title: "Billing & Insurance Claims",
      description: `## Overview
Create a medical billing system with insurance claim generation, CPT code management, claim status tracking, and payment processing integration.

## User Stories
- As a billing clerk, I want to generate insurance claims so that the clinic receives reimbursement
- As a patient, I want to view my bills online so that I know what I owe
- As an admin, I want to track claim status so that I can follow up on denials

## Functional Requirements
1. The system shall generate CMS-1500 claim forms with patient, provider, and procedure information
2. The system shall support CPT code search and association with procedures and pricing
3. The system must track claim status (submitted, pending, approved, denied, appealed)
4. The application should calculate patient responsibility based on insurance coverage (copay, deductible, coinsurance)
5. The system shall integrate with payment gateway for patient payments (Stripe)
6. The system must generate invoices and receipts in PDF format

## Technical Requirements
- **Stack**: React billing interface, Node.js backend, Stripe API, PDF generation (PDFKit)
- **Database**: Claim, ClaimLine, Payment tables with procedure and insurance linkage
- **APIs**: POST /claims, GET /claims/:id/status, POST /payments, GET /invoices/:id/pdf, GET /cpt/search
- **Security**: PCI compliance for payment processing, encrypted storage of payment information
- **Performance**: Claim generation < 2s, payment processing < 3s, CPT search < 200ms

## Acceptance Criteria
- [ ] Claim form auto-populates with patient and encounter data
- [ ] CPT code search provides autocomplete with descriptions and standard fees
- [ ] Claim status updates reflect real responses from insurance clearinghouse
- [ ] Patient responsibility calculation shows breakdown of copay, deductible, coinsurance
- [ ] Payment page supports credit card with PCI-compliant Stripe integration
- [ ] Invoice PDF includes itemized charges with CPT codes and descriptions

## Dependencies
- Patient Registration (billing linked to patients)
- Electronic Health Records (procedures from encounters)

## Estimated Complexity
**High** - Requires CMS-1500 form generation, CPT code database integration, insurance clearinghouse API integration, payment gateway setup, complex calculation logic for patient responsibility.`,
      tags: ["backend", "api", "payments", "integration", "compliance"],
    },
  });
  allFeatures.push(health4);

  const health5 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project2.id,
      title: "Patient Portal",
      description: `## Overview
Develop a patient-facing web portal for appointment booking, medical record access, messaging providers, prescription refill requests, and bill payment.

## User Stories
- As a patient, I want to view my medical records online so that I can access my health information anytime
- As a patient, I want to message my doctor so that I can ask questions between visits
- As a patient, I want to request prescription refills so that I don't run out of medication

## Functional Requirements
1. The system shall allow patients to view their medical records including lab results and visit summaries
2. The system shall provide secure messaging with providers with 24-48 hour response time expectation
3. The system must allow appointment booking with provider and time slot selection
4. The application should support prescription refill requests with pharmacy selection
5. The system shall display billing statements with online payment option
6. The system must send email notifications for new messages, appointments, and lab results

## Technical Requirements
- **Stack**: React patient portal, responsive design for mobile, Node.js backend
- **Database**: Message, RefillRequest tables with patient-provider relationships
- **APIs**: GET /patient/records, POST /patient/messages, POST /patient/refills, GET /patient/appointments
- **Security**: Patient authentication, data access limited to own records, message encryption
- **Performance**: Portal load < 2s, message delivery < 1s, real-time notification via WebSocket

## Acceptance Criteria
- [ ] Patient can log in with email and view personalized dashboard
- [ ] Medical records display with lab results and trend charts for vitals
- [ ] Messaging interface shows conversation history with unread message indicators
- [ ] Appointment booking shows available slots and confirms booking via email
- [ ] Prescription refill form lists active medications with refill remaining count
- [ ] Bill payment redirects to secure Stripe checkout with confirmation email

## Dependencies
- Patient Registration (portal account linked to patient record)
- Electronic Health Records (medical record access)
- Appointment Scheduling (booking functionality)

## Estimated Complexity
**Medium** - Requires patient portal UI design, secure messaging system, notification system, integration with existing modules (EHR, scheduling, billing), and mobile-responsive implementation.`,
      tags: ["frontend", "backend", "api", "ui", "security"],
    },
  });
  allFeatures.push(health5);

  const health6 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project2.id,
      title: "Provider Dashboard & Workflow",
      description: `## Overview
Build a provider-centric dashboard with daily schedule view, patient queue management, quick access to charts, task lists, and clinical decision support alerts.

## User Stories
- As a doctor, I want to see my daily schedule so that I know which patients I'm seeing
- As a doctor, I want quick access to patient charts so that I can review before appointments
- As a doctor, I want to receive clinical alerts so that I don't miss important patient updates

## Functional Requirements
1. The system shall display provider daily schedule with patient names, times, and appointment types
2. The system shall show patient queue with check-in status and wait time tracking
3. The system must provide one-click access to patient chart from schedule view
4. The application should display task list (prescription refills to review, lab results to sign off, messages to respond)
5. The system shall show clinical decision support alerts (drug interactions, preventive care due, abnormal lab results)
6. The system must track provider productivity metrics (patients seen, encounter completion rate)

## Technical Requirements
- **Stack**: React dashboard with real-time updates (WebSocket), chart data prefetching for performance
- **Database**: Task, Alert tables with provider assignments, dashboard views for efficient queries
- **APIs**: GET /providers/dashboard, GET /providers/queue, PUT /tasks/:id/complete, GET /providers/metrics
- **Security**: Provider-only access, patient data access logging
- **Performance**: Dashboard load < 1s, real-time queue updates < 500ms, chart prefetch on hover

## Acceptance Criteria
- [ ] Schedule displays all appointments for selected day with color coding by appointment type
- [ ] Patient queue updates in real-time when patients check in
- [ ] Clicking patient name opens chart in new tab with pre-loaded data
- [ ] Task list shows counts with priority indicators (urgent, routine)
- [ ] Clinical alerts display with severity levels and require acknowledgment
- [ ] Productivity metrics update end-of-day showing completed encounters

## Dependencies
- Appointment Scheduling (schedule data)
- Electronic Health Records (chart access)
- Patient Registration (patient information)

## Estimated Complexity
**Medium** - Requires real-time dashboard updates, efficient data prefetching, task management system, clinical alerting logic, and productivity metric calculations.`,
      tags: ["frontend", "backend", "api", "ui", "realtime"],
    },
  });
  allFeatures.push(health6);

  const health7 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project2.id,
      title: "Lab & Imaging Integration",
      description: `## Overview
Integrate with laboratory and imaging systems via HL7/FHIR standards for automated order placement, result import, and DICOM image viewing.

## User Stories
- As a doctor, I want to order lab tests electronically so that orders are sent automatically to the lab
- As a doctor, I want to view imaging results so that I can diagnose patients accurately
- As a lab technician, I want results to flow automatically to the EHR so that I don't need manual entry

## Functional Requirements
1. The system shall send lab orders to external lab systems via HL7 ORM messages
2. The system shall receive lab results via HL7 ORU messages with automatic patient matching
3. The system must support imaging orders (X-ray, CT, MRI) with CPT code association
4. The application should display DICOM images with zoom, pan, and measurement tools
5. The system shall flag critical lab results for immediate provider review
6. The system must maintain order status tracking (ordered, collected, in-progress, resulted, reviewed)

## Technical Requirements
- **Stack**: HL7 message processor (node-hl7), FHIR server integration, DICOM viewer library (Cornerstone.js)
- **Database**: LabOrder, ImagingOrder, Result tables with HL7 message ID tracking
- **APIs**: POST /orders/lab, POST /orders/imaging, POST /hl7/receive, GET /images/:id/dicom
- **Security**: Secure message transport (MLLP or HTTPS), result encryption, provider-only access to results
- **Performance**: HL7 message processing < 1s, DICOM image load < 3s for 100MB file

## Acceptance Criteria
- [ ] Lab order form sends HL7 ORM message to configured lab system
- [ ] Incoming HL7 ORU messages automatically create result records linked to patients
- [ ] Critical results trigger alerts and require provider acknowledgment
- [ ] DICOM viewer loads images with manipulation tools (zoom, pan, brightness/contrast)
- [ ] Order status updates reflect real lab system status via bidirectional HL7
- [ ] Failed HL7 messages logged with retry mechanism (up to 3 attempts)

## Dependencies
- Electronic Health Records (orders originate from encounters)
- Patient Registration (results linked to patients)

## Estimated Complexity
**High** - Requires HL7/FHIR integration expertise, DICOM image viewer implementation, message queue system for reliable delivery, critical result alerting, and patient matching algorithms.`,
      tags: ["integration", "backend", "api", "hl7", "fhir"],
    },
  });
  allFeatures.push(health7);

  const health8 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project2.id,
      title: "Compliance & Audit Reporting",
      description: `## Overview
Implement comprehensive audit logging, compliance reporting (HIPAA, HITECH), user activity monitoring, and automated compliance checks with report generation.

## User Stories
- As a compliance officer, I want to view audit logs so that I can verify HIPAA compliance
- As an admin, I want to run compliance reports so that I can prepare for audits
- As a security officer, I want to detect unauthorized access so that I can protect patient data

## Functional Requirements
1. The system shall log all access to patient records with user, timestamp, action, and IP address
2. The system shall generate HIPAA compliance reports showing access patterns and anomalies
3. The system must detect and alert on suspicious activity (mass record access, after-hours access, unauthorized roles)
4. The application should provide audit log search with filters (date range, user, patient, action type)
5. The system shall track user consent forms and authorization expiration dates
6. The system must generate compliance reports in PDF format for regulatory submissions

## Technical Requirements
- **Stack**: Node.js audit logging middleware, Elasticsearch for log storage and search, PDF generation
- **Database**: AuditLog table with partitioning for performance, indexes on timestamp and userId
- **APIs**: GET /audit/logs, GET /audit/reports, POST /audit/alerts/configure, GET /compliance/hipaa-report
- **Security**: Tamper-proof audit logs (append-only with checksum), admin-only access, log retention policy (7 years)
- **Performance**: Audit log write < 50ms (async), log search < 2s for 1M records, alert detection within 5 minutes

## Acceptance Criteria
- [ ] All patient record access logged with complete details (who, what, when, where)
- [ ] Compliance dashboard displays key metrics (total accesses, unique users, flagged events)
- [ ] Suspicious activity alerts sent via email to security team within 5 minutes
- [ ] Audit log search supports complex filters (user role, action type, patient ID)
- [ ] HIPAA report includes required sections (access log summary, breach incidents, risk analysis)
- [ ] Logs cannot be edited or deleted (immutable with digital signatures)

## Dependencies
- User Authentication (user activity tracking)
- Patient Registration (patient access logging)

## Estimated Complexity
**High** - Requires comprehensive audit logging infrastructure, Elasticsearch integration for log search, anomaly detection algorithms, tamper-proof log storage, and complex compliance report generation.`,
      tags: ["backend", "security", "compliance", "api", "monitoring"],
    },
  });
  allFeatures.push(health8);

  const health9 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project2.id,
      title: "Telemedicine Video Consultations",
      description: `## Overview
Integrate video consultation capabilities using WebRTC with virtual waiting rooms, screen sharing, session recording, and automated encounter documentation.

## User Stories
- As a patient, I want to attend virtual appointments so that I can see my doctor from home
- As a doctor, I want to conduct video visits so that I can provide care remotely
- As a compliance officer, I want video sessions recorded so that we have documentation

## Functional Requirements
1. The system shall provide WebRTC-based video/audio calls with HD quality support
2. The system shall implement virtual waiting room where patients wait until provider joins
3. The system must support screen sharing for reviewing medical images or reports
4. The application should record sessions (with consent) and store securely with encryption
5. The system shall automatically create encounter documentation from video visit
6. The system must work across browsers (Chrome, Firefox, Safari) and mobile devices

## Technical Requirements
- **Stack**: WebRTC libraries (Simple-Peer or Twilio Video), React video UI, Node.js signaling server
- **Database**: VideoSession table with recording URLs, session transcripts (if enabled)
- **APIs**: POST /telemedicine/sessions, POST /telemedicine/join, GET /telemedicine/recordings/:id
- **Security**: End-to-end encryption for video/audio, HIPAA-compliant recording storage, session authentication
- **Performance**: Video latency < 200ms, session initiation < 5s, recording processing < 10min for 30min session

## Acceptance Criteria
- [ ] Patient joins waiting room and sees "waiting for provider" message
- [ ] Provider receives notification when patient in waiting room
- [ ] Video/audio quality adapts to network conditions automatically
- [ ] Screen sharing works bidirectionally (provider and patient)
- [ ] Session recording saved to encrypted storage with patient consent
- [ ] Encounter auto-created after video visit with session duration and summary

## Dependencies
- Appointment Scheduling (video visit appointments)
- Electronic Health Records (encounter documentation)
- Patient Registration (participant verification)

## Estimated Complexity
**High** - Requires WebRTC implementation with signaling server, HIPAA-compliant video encryption, session recording infrastructure, cross-browser compatibility, and network adaptability for varying connection quality.`,
      tags: ["integration", "frontend", "backend", "webrtc", "realtime"],
    },
  });
  allFeatures.push(health9);

  const health10 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project2.id,
      title: "Healthcare Analytics & Reporting",
      description: `## Overview
Build a comprehensive analytics platform with population health metrics, quality measure tracking, revenue cycle analytics, and customizable dashboards for clinical and administrative insights.

## User Stories
- As a clinic administrator, I want to view patient volume trends so that I can optimize staffing
- As a quality manager, I want to track quality measures so that I can ensure regulatory compliance
- As a CFO, I want to analyze revenue cycle metrics so that I can improve financial performance

## Functional Requirements
1. The system shall display population health metrics (diabetic control rates, vaccination coverage, chronic disease prevalence)
2. The system shall track CMS quality measures (HEDIS, MIPS) with performance benchmarking
3. The system must provide revenue cycle analytics (claims processed, denial rate, days in A/R, collection rate)
4. The application should allow custom dashboard creation with drag-and-drop widgets
5. The system shall support data export to Excel and PDF for external reporting
6. The system must calculate provider productivity metrics (RVUs, encounters per hour, panel size)

## Technical Requirements
- **Stack**: React dashboard builder, Chart.js/D3.js for visualizations, Node.js aggregation APIs
- **Database**: Materialized views for pre-aggregated metrics, OLAP cube for multi-dimensional analysis
- **APIs**: GET /analytics/population-health, GET /analytics/quality-measures, GET /analytics/revenue-cycle, POST /analytics/custom-dashboard
- **Security**: Role-based dashboard access, de-identified data for population health, admin-only financial data
- **Performance**: Dashboard load < 2s, metric calculations using indexed views, real-time updates via WebSocket

## Acceptance Criteria
- [ ] Population health dashboard shows disease prevalence with trend charts
- [ ] Quality measures display current performance vs benchmarks with gap analysis
- [ ] Revenue cycle metrics update daily with aging bucket breakdown
- [ ] Custom dashboard builder allows saving and sharing dashboards
- [ ] Export to Excel preserves formatting and includes all chart data
- [ ] Provider productivity report ranks providers by RVU with drill-down capability

## Dependencies
- Electronic Health Records (clinical data source)
- Billing & Insurance Claims (financial data source)
- Patient Registration (demographic data)

## Estimated Complexity
**High** - Requires complex aggregation queries across multiple data sources, materialized view management, advanced data visualization, custom dashboard framework, quality measure calculation logic.`,
      tags: ["analytics", "backend", "api", "visualization", "reporting"],
    },
  });
  allFeatures.push(health10);

  // ========== PROJECT 3: SOCIAL MEDIA DASHBOARD ==========

  const social1 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project3.id,
      title: "Multi-Platform Authentication",
      description: `## Overview
Implement OAuth 2.0 authentication for multiple social media platforms (Twitter, Facebook, Instagram, LinkedIn, TikTok) with token management and account linking.

## User Stories
- As a social media manager, I want to connect multiple social accounts so that I can manage them from one dashboard
- As a user, I want to securely authenticate so that my social media credentials are protected
- As a user, I want to link/unlink accounts so that I can control which platforms are connected

## Functional Requirements
1. The system shall support OAuth 2.0 authentication for Twitter, Facebook, Instagram, LinkedIn, and TikTok
2. The system shall allow users to connect multiple accounts per platform (e.g., 3 Twitter accounts)
3. The system must securely store access tokens and refresh tokens with encryption
4. The application should display connected accounts with platform icons and account names
5. The system shall handle token expiration with automatic refresh using refresh tokens
6. The system must allow account unlinking with confirmation dialog

## Technical Requirements
- **Stack**: React OAuth flow, Passport.js (Node.js), platform SDKs (Twitter API v2, Facebook Graph API)
- **Database**: ConnectedAccount table with encrypted tokens, platform-specific metadata
- **APIs**: GET /auth/:platform/callback, POST /accounts/link, DELETE /accounts/:id/unlink, GET /accounts
- **Security**: Token encryption at rest (AES-256), HTTPS-only, CSRF protection, scope validation
- **Performance**: OAuth flow completion < 5s, token refresh < 1s

## Acceptance Criteria
- [ ] User can click "Connect Twitter" and complete OAuth flow successfully
- [ ] Multiple accounts per platform display with distinct account names/avatars
- [ ] Expired tokens automatically refresh without user intervention
- [ ] Unlinking account removes all associated data and revokes tokens
- [ ] Failed OAuth shows user-friendly error message with retry option
- [ ] Platform rate limits tracked and displayed per connected account

## Dependencies
- None (foundational feature)

## Estimated Complexity
**High** - Requires OAuth 2.0 implementation for 5 different platforms with varying API specifications, secure token storage, automatic refresh logic, and error handling for platform-specific rate limits.`,
      tags: ["auth", "backend", "security", "api", "oauth"],
    },
  });
  allFeatures.push(social1);

  const social2 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project3.id,
      title: "Unified Content Feed",
      description: `## Overview
Create a real-time unified feed aggregating posts from all connected social platforms with filtering, search, and engagement metrics display.

## User Stories
- As a social media manager, I want to see all posts in one feed so that I can monitor content across platforms
- As a user, I want to filter by platform so that I can focus on specific channels
- As a user, I want to see engagement metrics so that I can identify high-performing content

## Functional Requirements
1. The system shall aggregate posts from all connected accounts into a unified chronological feed
2. The system shall display posts with platform-specific branding (colors, icons)
3. The system must show engagement metrics (likes, comments, shares, views) per post
4. The application should support filtering by platform, account, date range, and content type
5. The system shall implement infinite scroll pagination loading 20 posts per batch
6. The system must refresh feed in real-time with WebSocket updates for new posts

## Technical Requirements
- **Stack**: React infinite scroll (react-window), WebSocket (Socket.io), Node.js aggregation
- **Database**: Post table with platform enum, engagement metrics columns, full-text search index
- **APIs**: GET /feed, GET /feed/refresh, WebSocket /feed/subscribe, POST /feed/filter
- **Security**: User-specific feed (only posts from connected accounts), rate limiting
- **Performance**: Initial feed load < 2s, real-time updates < 500ms latency, search < 300ms

## Acceptance Criteria
- [ ] Feed displays posts from all platforms with correct platform icons
- [ ] Engagement metrics update in real-time when user interacts on native platform
- [ ] Filter by platform shows only posts from selected platform(s)
- [ ] Search finds posts by keyword in post text within 300ms
- [ ] Infinite scroll loads next batch when user scrolls near bottom
- [ ] New posts appear at top of feed automatically via WebSocket

## Dependencies
- Multi-Platform Authentication (requires connected accounts to fetch posts)

## Estimated Complexity
**High** - Requires real-time data aggregation from 5 platforms with different APIs, WebSocket implementation, infinite scroll with efficient pagination, full-text search, and engagement metric synchronization.`,
      tags: ["frontend", "backend", "realtime", "api", "websocket"],
    },
  });
  allFeatures.push(social2);

  const social3 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project3.id,
      title: "Post Scheduling & Publishing",
      description: `## Overview
Build a content scheduler allowing users to compose, schedule, and publish posts to multiple platforms simultaneously with media upload and preview capabilities.

## User Stories
- As a social media manager, I want to schedule posts in advance so that I can maintain consistent posting
- As a user, I want to publish to multiple platforms at once so that I save time
- As a user, I want to preview posts so that I can see how they'll look before publishing

## Functional Requirements
1. The system shall provide a post composer with rich text editing and character count per platform
2. The system shall support media uploads (images, videos, GIFs) with platform-specific size limits
3. The system must allow scheduling posts for specific date/time with timezone selection
4. The application should enable multi-platform publishing in a single action
5. The system shall display platform-specific previews showing how post will appear
6. The system must maintain scheduled post queue with status tracking (draft, scheduled, published, failed)

## Technical Requirements
- **Stack**: React rich text editor (Slate.js), media upload with preview, Node.js scheduler (Bull queue)
- **Database**: ScheduledPost, PostMedia tables with foreign keys to platforms, job queue for publishing
- **APIs**: POST /posts/create, POST /posts/schedule, PUT /posts/:id, DELETE /posts/:id, GET /posts/queue
- **Security**: Media file validation (type, size, virus scan), user ownership verification
- **Performance**: Media upload < 10s for 50MB video, publishing to 5 platforms < 5s

## Acceptance Criteria
- [ ] Post composer shows character count with platform limits (Twitter 280, LinkedIn 3000)
- [ ] Media upload supports drag-and-drop with progress indicator
- [ ] Platform preview accurately reflects how post will appear on each network
- [ ] Scheduled posts appear in calendar view with drag-to-reschedule
- [ ] Multi-platform publish succeeds even if one platform fails (partial success)
- [ ] Failed posts show error reason with retry option

## Dependencies
- Multi-Platform Authentication (publishing requires connected accounts)

## Estimated Complexity
**High** - Requires rich text editor with platform-specific validation, media processing and upload, background job queue for scheduled publishing, platform API integration for posting, and error handling for partial failures.`,
      tags: ["frontend", "backend", "api", "integration", "scheduling"],
    },
  });
  allFeatures.push(social3);

  const social4 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project3.id,
      title: "Engagement Analytics Dashboard",
      description: `## Overview
Develop a comprehensive analytics dashboard with engagement metrics, follower growth, reach/impressions, top-performing content, and exportable reports.

## User Stories
- As a marketer, I want to see engagement trends so that I can optimize content strategy
- As a manager, I want to track follower growth so that I can measure brand awareness
- As an analyst, I want to export reports so that I can share insights with stakeholders

## Functional Requirements
1. The system shall display engagement metrics (likes, comments, shares, saves) with trend charts
2. The system shall track follower growth over time with daily/weekly/monthly granularity
3. The system must calculate reach and impressions per platform with breakdown by post type
4. The application should rank top-performing posts by engagement rate with thumbnail previews
5. The system shall provide custom date range selection and comparison with previous periods
6. The system must allow report export in PDF and CSV formats with charts and raw data

## Technical Requirements
- **Stack**: React Chart.js/Recharts, Node.js aggregation APIs, PDF generation (Puppeteer)
- **Database**: EngagementMetric table with timestamp partitioning, materialized views for aggregations
- **APIs**: GET /analytics/engagement, GET /analytics/growth, GET /analytics/top-posts, POST /analytics/export
- **Security**: User-specific analytics (only data from connected accounts), rate limiting on exports
- **Performance**: Dashboard load < 2s, metric aggregation via indexed views, export generation < 5s

## Acceptance Criteria
- [ ] Engagement chart displays likes, comments, shares with selectable date range
- [ ] Follower growth chart shows trend with percentage change vs previous period
- [ ] Top posts ranked by engagement rate with platform and post type labels
- [ ] Date comparison shows side-by-side metrics (e.g., this month vs last month)
- [ ] PDF export includes all charts as images with formatted tables
- [ ] CSV export contains raw data with timestamps and metric breakdowns

## Dependencies
- Unified Content Feed (post data source)
- Multi-Platform Authentication (account-specific metrics)

## Estimated Complexity
**Medium** - Requires complex aggregation queries with time-series analysis, chart visualization library integration, PDF export with chart rendering, and comparison period calculations.`,
      tags: ["analytics", "frontend", "backend", "visualization", "reporting"],
    },
  });
  allFeatures.push(social4);

  const social5 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project3.id,
      title: "Sentiment Analysis & Monitoring",
      description: `## Overview
Implement AI-powered sentiment analysis for comments and mentions with real-time monitoring, alerts for negative sentiment, and sentiment trend tracking.

## User Stories
- As a brand manager, I want to monitor sentiment so that I can respond to negative feedback quickly
- As a social media manager, I want to see sentiment trends so that I can measure brand perception
- As a customer service rep, I want alerts for negative comments so that I can address issues promptly

## Functional Requirements
1. The system shall analyze sentiment of comments and mentions using NLP (positive, negative, neutral)
2. The system shall display sentiment distribution with pie chart and percentage breakdown
3. The system must send real-time alerts for negative sentiment spikes via email and in-app notifications
4. The application should track sentiment trends over time with line charts
5. The system shall provide word cloud visualization of frequently mentioned terms
6. The system must allow filtering by sentiment to view all positive, negative, or neutral comments

## Technical Requirements
- **Stack**: NLP library (HuggingFace Transformers or AWS Comprehend), React visualization, WebSocket alerts
- **Database**: Sentiment table with score (-1 to 1), keyword extraction, timestamp indexing
- **APIs**: POST /sentiment/analyze, GET /sentiment/trends, GET /sentiment/alerts, WebSocket /sentiment/subscribe
- **Security**: Rate limiting on sentiment analysis API calls, user-specific sentiment data
- **Performance**: Sentiment analysis < 500ms per comment, batch analysis 100 comments/min, alert delivery < 30s

## Acceptance Criteria
- [ ] Comments automatically analyzed for sentiment with color coding (green, yellow, red)
- [ ] Sentiment distribution chart updates in real-time as new comments arrive
- [ ] Alert sent via email when negative sentiment exceeds 30% in 1-hour window
- [ ] Sentiment trend chart shows 7-day rolling average with comparison to previous week
- [ ] Word cloud highlights most frequent positive and negative keywords
- [ ] Filter by sentiment shows relevant comments sorted by recency

## Dependencies
- Unified Content Feed (comments and mentions data source)

## Estimated Complexity
**High** - Requires NLP model integration or third-party API, real-time comment monitoring, alerting system with threshold configuration, keyword extraction, and sentiment trend calculations.`,
      tags: ["ai", "backend", "api", "analytics", "realtime"],
    },
  });
  allFeatures.push(social5);

  const social6 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project3.id,
      title: "Competitor Analysis Tracking",
      description: `## Overview
Build a competitor tracking system monitoring competitor accounts, comparing engagement metrics, benchmarking performance, and identifying content gaps.

## User Stories
- As a strategist, I want to track competitors so that I can understand their social media strategy
- As a marketer, I want to compare our performance so that I can identify areas for improvement
- As a content creator, I want to see competitor top posts so that I can learn from successful content

## Functional Requirements
1. The system shall allow adding competitor accounts by platform username
2. The system shall track competitor post frequency, engagement rates, and follower growth
3. The system must provide side-by-side comparison charts (us vs competitors)
4. The application should identify competitor top-performing posts with engagement metrics
5. The system shall detect content gaps by analyzing competitor hashtags and topics
6. The system must generate weekly competitor reports with key insights and recommendations

## Technical Requirements
- **Stack**: React comparison charts, Node.js background jobs for competitor data collection
- **Database**: CompetitorAccount, CompetitorPost, CompetitorMetric tables with scheduled refresh
- **APIs**: POST /competitors/add, GET /competitors/compare, GET /competitors/top-posts, GET /competitors/report
- **Security**: Public data only (no authentication required for competitor accounts), rate limiting
- **Performance**: Competitor data refresh every 6 hours, comparison dashboard load < 3s

## Acceptance Criteria
- [ ] Adding competitor by username validates account exists and starts tracking
- [ ] Comparison chart shows engagement rate, post frequency, follower growth side-by-side
- [ ] Competitor top posts ranked by engagement with thumbnail and metrics
- [ ] Content gap analysis shows hashtags used by competitors but not by user
- [ ] Weekly report sent via email with insights (e.g., "Competitor A posts 2x more than you")
- [ ] Competitor data updates automatically every 6 hours in background

## Dependencies
- Multi-Platform Authentication (for platform API access)
- Engagement Analytics Dashboard (for comparison baseline)

## Estimated Complexity
**Medium** - Requires background job scheduling for competitor data collection, comparison calculation logic, content analysis for gap detection, and automated report generation with insights.`,
      tags: ["analytics", "backend", "api", "automation", "reporting"],
    },
  });
  allFeatures.push(social6);

  const social7 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project3.id,
      title: "Hashtag & Keyword Tracking",
      description: `## Overview
Implement hashtag and keyword monitoring across platforms with trend detection, performance analytics, and hashtag suggestion engine powered by AI.

## User Stories
- As a social media manager, I want to track hashtag performance so that I can use effective tags
- As a marketer, I want to discover trending hashtags so that I can increase reach
- As a content creator, I want hashtag suggestions so that I can optimize my posts

## Functional Requirements
1. The system shall track performance of hashtags used in posts (reach, impressions, engagement)
2. The system shall monitor trending hashtags per platform with real-time updates
3. The system must provide hashtag analytics (best performing times, associated content types)
4. The application should suggest relevant hashtags based on post content using AI
5. The system shall allow saving favorite hashtag groups for quick reuse
6. The system must detect banned or spammy hashtags with warnings

## Technical Requirements
- **Stack**: NLP for content analysis (OpenAI GPT or spaCy), React autocomplete, real-time trend API
- **Database**: Hashtag, HashtagPerformance tables with usage tracking, trending hashtag cache
- **APIs**: POST /hashtags/suggest, GET /hashtags/trending, GET /hashtags/:tag/analytics, POST /hashtags/groups
- **Security**: Rate limiting on AI suggestions, spam hashtag database
- **Performance**: Hashtag suggestions < 1s, trending hashtag refresh every 15min, analytics query < 500ms

## Acceptance Criteria
- [ ] Hashtag performance shows reach and engagement per hashtag with trend arrows
- [ ] Trending hashtags display with volume count and category (sports, tech, entertainment)
- [ ] AI suggestion provides 10-15 relevant hashtags based on post text and images
- [ ] Hashtag groups saved with custom names and quick "add all" button in composer
- [ ] Banned hashtag warning shows before publishing with alternative suggestions
- [ ] Hashtag analytics shows best posting times and content types for each tag

## Dependencies
- Post Scheduling & Publishing (hashtag usage tracking)
- Unified Content Feed (hashtag performance data)

## Estimated Complexity
**High** - Requires AI integration for hashtag suggestion, real-time trending data from platform APIs, performance analytics aggregation, spam detection database, and hashtag group management.`,
      tags: ["ai", "backend", "api", "analytics", "nlp"],
    },
  });
  allFeatures.push(social7);

  const social8 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project3.id,
      title: "Social Listening & Mentions",
      description: `## Overview
Create a social listening tool tracking brand mentions, @mentions, and keyword alerts across platforms with engagement opportunities identification.

## User Stories
- As a brand manager, I want to monitor mentions so that I can respond to customer feedback
- As a PR specialist, I want keyword alerts so that I can track brand reputation
- As a community manager, I want to find engagement opportunities so that I can interact with users

## Functional Requirements
1. The system shall monitor @mentions across all connected platforms in real-time
2. The system shall track keywords and phrases (brand name, product names, campaign slogans)
3. The system must categorize mentions by sentiment and priority (influencer, high engagement, negative)
4. The application should provide quick reply functionality directly from dashboard
5. The system shall identify engagement opportunities (questions, purchase intent, complaints)
6. The system must send real-time notifications for high-priority mentions

## Technical Requirements
- **Stack**: WebSocket for real-time mentions, NLP for categorization, React notification system
- **Database**: Mention table with sentiment, priority, status (unread, read, replied), keyword matching
- **APIs**: GET /mentions, POST /mentions/:id/reply, POST /keywords/track, WebSocket /mentions/subscribe
- **Security**: User-specific mentions, rate limiting on platform APIs
- **Performance**: Mention detection < 1min, sentiment analysis < 500ms, notification delivery < 5s

## Acceptance Criteria
- [ ] New mentions appear in dashboard within 1 minute of posting on native platform
- [ ] Mentions categorized by sentiment with color coding and priority badges
- [ ] Quick reply button opens pre-populated response form with mention context
- [ ] Keyword alerts trigger notifications when tracked phrase mentioned
- [ ] Engagement opportunities highlighted with suggested responses (AI-powered)
- [ ] High-priority mentions (from influencers or negative sentiment) send push notifications

## Dependencies
- Multi-Platform Authentication (for mention monitoring)
- Sentiment Analysis (for mention categorization)

## Estimated Complexity
**High** - Requires real-time monitoring via platform webhooks or polling, NLP for sentiment and priority classification, quick reply integration with platform APIs, and intelligent notification system.`,
      tags: ["realtime", "backend", "api", "ai", "websocket"],
    },
  });
  allFeatures.push(social8);

  const social9 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project3.id,
      title: "Team Collaboration & Workflows",
      description: `## Overview
Implement team collaboration features with role-based permissions, post approval workflows, task assignment, and activity audit logs.

## User Stories
- As a team lead, I want to assign posts for approval so that content is reviewed before publishing
- As a content creator, I want to draft posts so that managers can approve before scheduling
- As an admin, I want role-based access so that team members only see relevant features

## Functional Requirements
1. The system shall support multiple user roles (Admin, Manager, Creator, Analyst, Viewer)
2. The system shall implement post approval workflow (draft → pending → approved → published)
3. The system must allow task assignment with due dates and priority levels
4. The application should provide activity feed showing team member actions
5. The system shall support comments and feedback on draft posts
6. The system must maintain audit log of all content changes and approvals

## Technical Requirements
- **Stack**: React role-based UI, Node.js workflow engine, real-time activity feed (WebSocket)
- **Database**: User, Role, WorkflowState, Task, ActivityLog tables with foreign key relationships
- **APIs**: POST /posts/submit-approval, PUT /posts/:id/approve, POST /tasks/assign, GET /activity-feed
- **Security**: Role-based access control (RBAC), permission checks on all endpoints
- **Performance**: Workflow state transitions < 200ms, activity feed updates real-time

## Acceptance Criteria
- [ ] Creator can submit post for approval which notifies manager
- [ ] Manager sees pending posts with approve/reject buttons and comment field
- [ ] Approved posts automatically move to scheduled state if date/time set
- [ ] Task assignment sends email notification with due date reminder
- [ ] Activity feed shows "User X approved post Y" in real-time
- [ ] Audit log captures all post edits with diff view showing changes

## Dependencies
- Post Scheduling & Publishing (workflow integrates with post creation)
- Multi-Platform Authentication (user roles and permissions)

## Estimated Complexity
**Medium** - Requires RBAC implementation, workflow state machine, task management system, real-time activity feed, and comprehensive audit logging with change tracking.`,
      tags: ["collaboration", "backend", "frontend", "api", "workflow"],
    },
  });
  allFeatures.push(social9);

  const social10 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project3.id,
      title: "Custom Reporting & Insights",
      description: `## Overview
Build a custom report builder with drag-and-drop widgets, automated scheduled reports, white-label PDF exports, and AI-powered insights and recommendations.

## User Stories
- As an analyst, I want to create custom reports so that I can focus on specific metrics
- As a manager, I want scheduled reports so that I receive insights automatically
- As a client-facing agency, I want white-label reports so that I can add my branding

## Functional Requirements
1. The system shall provide drag-and-drop report builder with widget library (charts, tables, metrics)
2. The system shall support automated report scheduling (daily, weekly, monthly) with email delivery
3. The system must allow white-label customization (logo, colors, company name)
4. The application should generate AI-powered insights ("Engagement up 25% due to video content")
5. The system shall support multiple export formats (PDF, Excel, PowerPoint)
6. The system must allow report templates for quick creation of common reports

## Technical Requirements
- **Stack**: React drag-and-drop (react-beautiful-dnd), PDF generation (Puppeteer), AI insights (OpenAI GPT)
- **Database**: Report, ReportWidget, ReportSchedule tables with user-specific templates
- **APIs**: POST /reports/create, POST /reports/schedule, GET /reports/:id/export, POST /reports/ai-insights
- **Security**: User-specific reports, white-label settings per organization
- **Performance**: Report generation < 10s for 50-page report, AI insights < 3s

## Acceptance Criteria
- [ ] Report builder allows dragging widgets to canvas with resize and position
- [ ] Scheduled report sends email at configured time with PDF attachment
- [ ] White-label report displays custom logo and brand colors throughout
- [ ] AI insights analyze data and provide 3-5 actionable recommendations
- [ ] Excel export preserves formatting with separate sheets for each metric
- [ ] Report templates include "Weekly Performance", "Monthly Executive Summary", "Competitor Analysis"

## Dependencies
- Engagement Analytics Dashboard (data source for widgets)
- Team Collaboration & Workflows (for sharing reports)

## Estimated Complexity
**High** - Requires drag-and-drop report builder UI, scheduled job system for automated reports, PDF/Excel export with custom branding, AI integration for insights, and template management system.`,
      tags: ["reporting", "frontend", "backend", "ai", "automation"],
    },
  });
  allFeatures.push(social10);

  // ========== PROJECT 4: FINANCIAL ANALYTICS PLATFORM ==========

  const finance1 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project4.id,
      title: "Portfolio Management & Tracking",
      description: `## Overview
Build a comprehensive portfolio management system with real-time asset tracking, position monitoring, cost basis calculation, and performance attribution analysis.

## User Stories
- As an investor, I want to track my holdings so that I can monitor my portfolio value
- As a portfolio manager, I want to see performance attribution so that I understand what's driving returns
- As a trader, I want to track cost basis so that I can calculate accurate gains and losses

## Functional Requirements
1. The system shall track multiple portfolios with cash and securities positions
2. The system shall calculate real-time portfolio value using live market data
3. The system must maintain cost basis tracking with support for FIFO, LIFO, and specific lot methods
4. The application should provide performance attribution (sector, asset class, security level)
5. The system shall display unrealized gains/losses with percentage returns
6. The system must support manual position entry and import from brokerage CSV files

## Technical Requirements
- **Stack**: React portfolio dashboard, Node.js backend, real-time market data API (Alpha Vantage or Polygon.io)
- **Database**: Portfolio, Position, Transaction tables with cost basis calculation triggers
- **APIs**: POST /portfolios, POST /positions, GET /portfolios/:id/performance, POST /transactions/import
- **Security**: User-specific portfolio access, encrypted brokerage credentials
- **Performance**: Portfolio value calculation < 1s for 500 positions, real-time price updates every 30s

## Acceptance Criteria
- [ ] Portfolio dashboard displays total value, day change, and allocation pie chart
- [ ] Position table shows quantity, cost basis, current value, unrealized gain/loss
- [ ] Performance attribution breaks down returns by sector and asset class
- [ ] CSV import validates data and creates transactions with cost basis
- [ ] Real-time price updates reflect in portfolio value without page refresh
- [ ] Cost basis calculation supports tax lot selection for partial sales

## Dependencies
- None (foundational feature)

## Estimated Complexity
**High** - Requires real-time market data integration, complex cost basis calculation with multiple accounting methods, performance attribution algorithms, CSV import with validation, and efficient portfolio aggregation.`,
      tags: ["backend", "api", "database", "integration", "realtime"],
    },
  });
  allFeatures.push(finance1);

  const finance2 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project4.id,
      title: "Real-Time Market Data Feed",
      description: `## Overview
Integrate real-time market data with streaming quotes, price alerts, level 2 data, and historical price charts for stocks, ETFs, crypto, and forex.

## User Stories
- As a trader, I want real-time quotes so that I can make timely investment decisions
- As an investor, I want price alerts so that I'm notified when stocks hit target prices
- As an analyst, I want historical charts so that I can perform technical analysis

## Functional Requirements
1. The system shall provide real-time streaming quotes with bid/ask spreads and volume
2. The system shall support price alerts with email and push notifications
3. The system must display interactive charts with technical indicators (MA, RSI, MACD, Bollinger Bands)
4. The application should cover multiple asset classes (stocks, ETFs, crypto, forex, commodities)
5. The system shall show level 2 data (order book depth) for supported securities
6. The system must provide intraday charts (1min, 5min, 15min) and daily/weekly/monthly views

## Technical Requirements
- **Stack**: WebSocket for streaming data, React charting library (TradingView or Lightweight Charts), data provider API
- **Database**: Quote cache (Redis), historical price data (TimescaleDB or PostgreSQL with partitioning)
- **APIs**: WebSocket /market-data/stream, GET /market-data/quote/:symbol, GET /market-data/chart/:symbol, POST /alerts
- **Security**: Rate limiting based on subscription tier, API key authentication for data provider
- **Performance**: Quote latency < 100ms, chart load < 1s for 1 year of daily data, alert delivery < 5s

## Acceptance Criteria
- [ ] Quote widget updates prices in real-time via WebSocket with green/red flash on change
- [ ] Price alert triggered when symbol crosses threshold with notification sent
- [ ] Chart displays candlesticks with zoom, pan, and drawing tools (trendlines)
- [ ] Technical indicators selectable from dropdown with configurable parameters
- [ ] Level 2 data shows bid/ask ladder with size and number of orders
- [ ] Asset search autocomplete finds symbols across stocks, crypto, forex

## Dependencies
- None (foundational feature)

## Estimated Complexity
**High** - Requires WebSocket integration for real-time data streaming, charting library with technical indicators, historical data storage optimization, alert system with notification delivery, and multi-asset data provider integration.`,
      tags: ["realtime", "backend", "api", "integration", "websocket"],
    },
  });
  allFeatures.push(finance2);

  const finance3 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project3.id,
      title: "Financial Statement Analysis",
      description: `## Overview
Provide comprehensive financial statement analysis with income statements, balance sheets, cash flow statements, ratio calculations, and peer comparison.

## User Stories
- As an analyst, I want to view financial statements so that I can evaluate company fundamentals
- As an investor, I want financial ratios so that I can compare companies
- As a researcher, I want historical financials so that I can analyze trends

## Functional Requirements
1. The system shall display income statements, balance sheets, and cash flow statements (quarterly and annual)
2. The system shall calculate key financial ratios (P/E, P/B, ROE, ROA, debt-to-equity, current ratio)
3. The system must provide trend analysis with 5-year historical comparisons
4. The application should support peer comparison with industry averages
5. The system shall visualize financials with charts (revenue growth, margin trends, cash flow waterfall)
6. The system must allow export of financial data to Excel for further analysis

## Technical Requirements
- **Stack**: React data tables and charts, financial data API (Financial Modeling Prep or SEC Edgar)
- **Database**: FinancialStatement, FinancialRatio tables with company and period foreign keys
- **APIs**: GET /financials/:symbol/income-statement, GET /financials/:symbol/ratios, GET /financials/:symbol/peers
- **Security**: Rate limiting on financial data API calls, user subscription tier validation
- **Performance**: Financial statement load < 2s, ratio calculation < 500ms, peer comparison < 1s

## Acceptance Criteria
- [ ] Income statement displays revenue, expenses, net income with quarter-over-quarter change
- [ ] Balance sheet shows assets, liabilities, equity with year-over-year comparison
- [ ] Cash flow statement breaks down operating, investing, financing activities
- [ ] Ratios calculated with industry percentile ranking (e.g., P/E in top 25%)
- [ ] Peer comparison table ranks companies by selected metric (revenue, margins, growth)
- [ ] Export to Excel includes all statements with formatting and formulas

## Dependencies
- Real-Time Market Data Feed (for current stock prices in ratio calculations)

## Estimated Complexity
**Medium** - Requires financial data API integration, ratio calculation engine, peer comparison logic, data visualization for financial trends, and Excel export with formatting.`,
      tags: ["backend", "api", "analytics", "visualization", "database"],
    },
  });
  allFeatures.push(finance3);

  const finance4 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project4.id,
      title: "Custom Screener & Filters",
      description: `## Overview
Build a powerful stock screener with customizable filters, pre-built screens, saved searches, and real-time results with sorting and export capabilities.

## User Stories
- As a trader, I want to screen for stocks so that I can find trading opportunities
- As an investor, I want to save custom screens so that I can run them regularly
- As an analyst, I want pre-built screens so that I can quickly find value/growth/momentum stocks

## Functional Requirements
1. The system shall provide 50+ filter criteria (price, volume, market cap, P/E, dividend yield, technical indicators)
2. The system shall include pre-built screens (value, growth, momentum, dividend, small-cap growth)
3. The system must support complex filter logic (AND/OR conditions, ranges, percentiles)
4. The application should allow saving custom screens with user-defined names
5. The system shall display results in sortable table with real-time data updates
6. The system must support exporting screener results to CSV and Excel

## Technical Requirements
- **Stack**: React filter builder UI, Node.js query engine, screener data API
- **Database**: Screener, ScreenerCriteria, SavedScreen tables with user foreign keys
- **APIs**: POST /screener/run, POST /screener/save, GET /screener/prebuilt, GET /screener/:id/export
- **Security**: User-specific saved screens, rate limiting on screener runs
- **Performance**: Screener execution < 3s for 5000 stocks, real-time result updates every 30s

## Acceptance Criteria
- [ ] Filter builder allows adding multiple criteria with AND/OR logic
- [ ] Pre-built screens load with one click (e.g., "Dividend Aristocrats")
- [ ] Results table shows matching stocks with all selected columns sortable
- [ ] Saved screen can be loaded, edited, and re-run with updated data
- [ ] Export to CSV includes all result columns with timestamp
- [ ] Real-time updates show stocks entering/leaving screener results

## Dependencies
- Real-Time Market Data Feed (for current prices and technical indicators)
- Financial Statement Analysis (for fundamental criteria)

## Estimated Complexity
**High** - Requires complex query engine for filter combinations, screener data aggregation from multiple sources, saved screen management, real-time result updates, and efficient execution for large stock universes.`,
      tags: ["backend", "api", "database", "frontend", "analytics"],
    },
  });
  allFeatures.push(finance4);

  const finance5 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project4.id,
      title: "Risk Analytics & VaR Calculation",
      description: `## Overview
Implement risk analytics with Value at Risk (VaR), portfolio stress testing, correlation analysis, drawdown tracking, and risk-adjusted performance metrics.

## User Stories
- As a risk manager, I want to calculate VaR so that I can quantify potential losses
- As a portfolio manager, I want stress tests so that I can prepare for market shocks
- As an investor, I want correlation analysis so that I can build diversified portfolios

## Functional Requirements
1. The system shall calculate Value at Risk (VaR) using historical simulation, variance-covariance, and Monte Carlo methods
2. The system shall perform stress testing with predefined scenarios (2008 crisis, COVID crash, inflation shock)
3. The system must display correlation matrix heatmap for portfolio holdings
4. The application should track maximum drawdown and recovery periods
5. The system shall calculate risk-adjusted metrics (Sharpe ratio, Sortino ratio, Calmar ratio)
6. The system must provide portfolio risk decomposition by position, sector, and asset class

## Technical Requirements
- **Stack**: Python backend for risk calculations (NumPy, SciPy), React heatmap visualization (Plotly)
- **Database**: RiskMetric, StressTest, CorrelationData tables with daily calculations
- **APIs**: POST /risk/var, POST /risk/stress-test, GET /risk/correlation, GET /risk/decomposition
- **Security**: Portfolio-specific risk calculations, user access validation
- **Performance**: VaR calculation < 5s for 100-position portfolio, Monte Carlo 10K simulations < 10s

## Acceptance Criteria
- [ ] VaR calculation shows 95% and 99% confidence levels with $ amount at risk
- [ ] Stress test applies scenario shocks and displays projected portfolio impact
- [ ] Correlation heatmap displays color-coded matrix with values on hover
- [ ] Maximum drawdown chart shows peak, trough, and recovery timeline
- [ ] Sharpe ratio calculated with risk-free rate input option
- [ ] Risk decomposition pie chart shows contribution by position to total portfolio risk

## Dependencies
- Portfolio Management & Tracking (portfolio data for risk calculations)
- Real-Time Market Data Feed (for historical price data)

## Estimated Complexity
**High** - Requires advanced financial mathematics implementation (VaR models, Monte Carlo simulation), stress testing scenario engine, correlation calculation with matrix operations, and risk decomposition algorithms.`,
      tags: ["analytics", "backend", "api", "visualization", "python"],
    },
  });
  allFeatures.push(finance5);

  const finance6 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project4.id,
      title: "Automated Trading Strategies",
      description: `## Overview
Build a strategy backtesting and automation engine with visual strategy builder, historical simulation, performance metrics, and paper trading capabilities.

## User Stories
- As a quant trader, I want to backtest strategies so that I can validate ideas before risking capital
- As a developer, I want to code custom strategies so that I can implement complex algorithms
- As an investor, I want to paper trade so that I can test strategies in real-time without risk

## Functional Requirements
1. The system shall provide visual strategy builder with drag-and-drop indicators and rules
2. The system shall support custom strategy coding in Python with provided API
3. The system must perform historical backtesting with configurable date ranges and data frequency
4. The application should display backtest results (total return, Sharpe ratio, max drawdown, win rate)
5. The system shall enable paper trading to test strategies in real-time with simulated capital
6. The system must provide strategy optimization with parameter sweeping and walk-forward analysis

## Technical Requirements
- **Stack**: React visual builder, Python strategy execution engine (Backtrader or Zipline), Docker sandboxing
- **Database**: Strategy, Backtest, Trade tables with performance metrics
- **APIs**: POST /strategies/create, POST /strategies/backtest, POST /strategies/optimize, GET /paper-trading/positions
- **Security**: Code sandboxing for custom strategies, rate limiting on backtest runs, position limits for paper trading
- **Performance**: Backtest execution 5 years daily data < 30s, optimization 1000 parameter combinations < 5min

## Acceptance Criteria
- [ ] Visual builder creates strategy with buy/sell rules using technical indicators
- [ ] Custom Python strategy uploads and validates syntax before execution
- [ ] Backtest results show equity curve, trade log, and performance statistics
- [ ] Strategy optimization finds best parameters with heatmap visualization
- [ ] Paper trading executes strategies in real-time with position tracking
- [ ] Performance metrics calculated (Sharpe, Sortino, max DD, avg win/loss)

## Dependencies
- Real-Time Market Data Feed (for backtesting and paper trading data)
- Portfolio Management & Tracking (for paper trading position management)

## Estimated Complexity
**High** - Requires visual strategy builder UI, Python sandboxed execution environment, backtesting engine integration, parameter optimization algorithms, paper trading simulation with order matching, and comprehensive performance analytics.`,
      tags: ["backend", "api", "automation", "python", "trading"],
    },
  });
  allFeatures.push(finance6);

  const finance7 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project4.id,
      title: "Economic Calendar & News Feed",
      description: `## Overview
Integrate economic calendar with upcoming events, earnings releases, dividend dates, news feed aggregation, and sentiment analysis of financial news.

## User Stories
- As a trader, I want to see economic events so that I can anticipate market volatility
- As an investor, I want earnings dates so that I can prepare for company announcements
- As an analyst, I want news sentiment so that I can gauge market mood

## Functional Requirements
1. The system shall display economic calendar with central bank meetings, data releases (GDP, CPI, employment), and impact ratings
2. The system shall track earnings calendar with company names, dates, analyst estimates, and actual results
3. The system must aggregate financial news from multiple sources (Reuters, Bloomberg, WSJ, Financial Times)
4. The application should perform sentiment analysis on news headlines and articles
5. The system shall provide news alerts for followed stocks and customizable keywords
6. The system must allow filtering by event type, impact level, country, and asset class

## Technical Requirements
- **Stack**: News API aggregators (NewsAPI, Finnhub), NLP sentiment analysis (FinBERT), React calendar UI
- **Database**: EconomicEvent, EarningsEvent, NewsArticle, NewsSentiment tables with timestamp indexing
- **APIs**: GET /calendar/economic, GET /calendar/earnings, GET /news, POST /news/alerts, GET /news/sentiment
- **Security**: API key management for news sources, rate limiting on sentiment analysis
- **Performance**: Calendar load < 1s for 30-day range, news feed pagination 50 articles/page, sentiment analysis < 500ms

## Acceptance Criteria
- [ ] Economic calendar displays events with date, time, country, impact (high/medium/low)
- [ ] Earnings calendar shows EPS estimates vs actuals with surprise percentage
- [ ] News feed aggregates articles with source logo and publish timestamp
- [ ] Sentiment analysis shows percentage positive/negative with confidence score
- [ ] News alerts sent via email when keyword mentioned in headlines
- [ ] Event filters apply instantly without full page reload

## Dependencies
- Real-Time Market Data Feed (for contextual stock prices during events)

## Estimated Complexity
**Medium** - Requires multiple news API integrations, economic calendar data provider integration, NLP sentiment analysis implementation, alerting system, and efficient news aggregation with de-duplication.`,
      tags: ["integration", "backend", "api", "ai", "nlp"],
    },
  });
  allFeatures.push(finance7);

  const finance8 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project4.id,
      title: "Tax-Loss Harvesting Optimizer",
      description: `## Overview
Build a tax optimization tool identifying tax-loss harvesting opportunities, wash sale detection, capital gains projection, and tax-efficient rebalancing recommendations.

## User Stories
- As an investor, I want to identify losses to harvest so that I can reduce my tax liability
- As a tax planner, I want to project capital gains so that I can estimate tax owed
- As a portfolio manager, I want wash sale warnings so that I avoid disallowed losses

## Functional Requirements
1. The system shall identify positions with unrealized losses suitable for tax-loss harvesting
2. The system shall detect potential wash sales (repurchase within 30 days before/after sale)
3. The system must project short-term and long-term capital gains for current tax year
4. The application should suggest tax-efficient rebalancing strategies to minimize gains
5. The system shall calculate tax savings from harvesting with user's marginal tax rate input
6. The system must provide year-end tax report with realized gains/losses by tax lot

## Technical Requirements
- **Stack**: React tax dashboard, Node.js tax calculation engine, PostgreSQL for transaction history
- **Database**: Transaction, TaxLot, CapitalGain tables with cost basis tracking
- **APIs**: GET /tax/harvest-opportunities, GET /tax/wash-sales, GET /tax/projections, GET /tax/year-end-report
- **Security**: User-specific tax data, encrypted tax rate storage
- **Performance**: Harvest opportunity scan < 2s for 1000 positions, wash sale detection < 1s

## Acceptance Criteria
- [ ] Harvest opportunities list shows positions with losses, potential tax savings
- [ ] Wash sale warning displays when attempting to sell with recent purchase
- [ ] Capital gains projection shows short-term vs long-term breakdown with tax estimate
- [ ] Rebalancing suggestions recommend selling high-basis lots to minimize gains
- [ ] Tax savings calculation uses user's marginal federal + state tax rate
- [ ] Year-end report exports to CSV with all realized gains/losses by security

## Dependencies
- Portfolio Management & Tracking (for position and transaction data)

## Estimated Complexity
**High** - Requires tax-loss harvesting algorithm, wash sale detection with 61-day window tracking, capital gains calculation with FIFO/LIFO/specific lot methods, tax-efficient rebalancing optimizer, and comprehensive tax reporting.`,
      tags: ["backend", "api", "analytics", "database", "tax"],
    },
  });
  allFeatures.push(finance8);

  const finance9 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project4.id,
      title: "Broker Integration & Trading",
      description: `## Overview
Integrate with brokerage APIs (Alpaca, Interactive Brokers, TD Ameritrade) for live trading, order management, position syncing, and execution analytics.

## User Stories
- As a trader, I want to place orders from the platform so that I can execute trades quickly
- As an investor, I want automatic position sync so that my portfolio stays updated
- As an analyst, I want execution quality metrics so that I can evaluate broker performance

## Functional Requirements
1. The system shall connect to broker accounts via API with OAuth authentication
2. The system shall support order types (market, limit, stop, stop-limit, trailing stop)
3. The system must sync positions, balances, and transactions daily with manual refresh option
4. The application should display order status in real-time (pending, filled, partially filled, cancelled)
5. The system shall provide execution quality metrics (fill price vs quote, slippage, time to fill)
6. The system must maintain trade blotter with all order history and executions

## Technical Requirements
- **Stack**: Broker API SDKs (Alpaca SDK, IBKR API), React order entry UI, WebSocket for order updates
- **Database**: BrokerAccount, Order, Execution tables with broker-specific IDs
- **APIs**: POST /broker/connect, POST /orders/place, GET /orders/:id/status, POST /positions/sync
- **Security**: OAuth tokens encrypted at rest, broker credentials never stored, rate limiting per broker API limits
- **Performance**: Order placement < 500ms, position sync < 5s for 100 positions, order status updates real-time

## Acceptance Criteria
- [ ] Broker connection via OAuth flow completes and displays account balance
- [ ] Order entry form validates inputs (price, quantity) before submission
- [ ] Order status updates in real-time showing pending → filled transition
- [ ] Position sync imports all holdings with accurate cost basis
- [ ] Execution quality report shows average slippage by order type
- [ ] Trade blotter displays all orders with filters by status, symbol, date

## Dependencies
- Portfolio Management & Tracking (positions synced to portfolio)
- Real-Time Market Data Feed (for order price validation)

## Estimated Complexity
**High** - Requires multi-broker API integration with varying specifications, OAuth flow implementation, order management system with real-time status tracking, position reconciliation logic, and execution analytics calculations.`,
      tags: ["integration", "backend", "api", "trading", "realtime"],
    },
  });
  allFeatures.push(finance9);

  const finance10 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project4.id,
      title: "AI-Powered Investment Insights",
      description: `## Overview
Implement AI-driven investment insights with stock recommendations, anomaly detection, pattern recognition, and natural language query interface for financial data.

## User Stories
- As an investor, I want AI recommendations so that I can discover investment opportunities
- As a trader, I want anomaly alerts so that I can capitalize on unusual market movements
- As an analyst, I want natural language queries so that I can ask questions about my portfolio

## Functional Requirements
1. The system shall generate AI stock recommendations based on technical and fundamental analysis
2. The system shall detect price anomalies (unusual volume, gap ups/downs, volatility spikes)
3. The system must recognize chart patterns (head and shoulders, double top, triangles, flags)
4. The application should provide natural language query interface (e.g., "What are my best performing stocks this month?")
5. The system shall deliver personalized insights based on portfolio holdings and risk profile
6. The system must explain AI recommendations with supporting data and reasoning

## Technical Requirements
- **Stack**: Python ML models (scikit-learn, TensorFlow), OpenAI GPT for NL queries, React insight cards
- **Database**: AIRecommendation, Anomaly, Pattern tables with confidence scores
- **APIs**: GET /ai/recommendations, GET /ai/anomalies, POST /ai/query, GET /ai/patterns/:symbol
- **Security**: Rate limiting on AI inference calls, user-specific model personalization
- **Performance**: Recommendation generation < 5s, anomaly detection daily batch < 30min, NL query < 3s

## Acceptance Criteria
- [ ] AI recommendations display with "Buy", "Hold", "Sell" rating and confidence score
- [ ] Anomaly alerts sent when unusual activity detected with explanation
- [ ] Chart pattern recognition highlights patterns on price charts with labels
- [ ] Natural language query "Show me stocks with P/E < 15" returns accurate results
- [ ] Personalized insights consider user's risk tolerance and investment goals
- [ ] Recommendation explanation shows key factors (e.g., "Strong revenue growth, low valuation")

## Dependencies
- Real-Time Market Data Feed (for price and volume data)
- Financial Statement Analysis (for fundamental data)
- Portfolio Management & Tracking (for personalized insights)

## Estimated Complexity
**High** - Requires ML model development and training, anomaly detection algorithms, pattern recognition implementation, NLP integration for queries, personalized recommendation engine, and explainable AI system for transparency.`,
      tags: ["ai", "backend", "api", "ml", "nlp"],
    },
  });
  allFeatures.push(finance10);

  // ========== PROJECT 5: LEARNING MANAGEMENT SYSTEM ==========

  const lms1 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project5.id,
      title: "Course Creation & Management",
      description: `## Overview
Build a comprehensive course creation system with curriculum builder, module/lesson structure, multimedia content support, prerequisite configuration, and course publishing workflow.

## User Stories
- As an instructor, I want to create courses so that I can teach students online
- As an educator, I want to organize content into modules so that learning is structured
- As a course designer, I want to set prerequisites so that students take courses in proper order

## Functional Requirements
1. The system shall provide course creation wizard with title, description, category, difficulty level
2. The system shall support hierarchical content structure (Course → Modules → Lessons → Activities)
3. The system must allow multimedia uploads (video, PDF, presentations, images, audio) with 500MB file limit
4. The application should support multiple content types (video lecture, reading, quiz, assignment, discussion)
5. The system shall enable prerequisite course configuration with automatic enrollment gating
6. The system must support course versioning with draft/published status and version history

## Technical Requirements
- **Stack**: React course builder UI with drag-and-drop, Node.js backend, S3 for media storage
- **Database**: Course, Module, Lesson, Content tables with hierarchical relationships
- **APIs**: POST /courses, PUT /courses/:id/publish, POST /courses/:id/modules, POST /content/upload
- **Security**: Instructor-only course creation, content access control, virus scanning on uploads
- **Performance**: Course load < 2s, video upload with progress bar, content streaming < 1s buffering

## Acceptance Criteria
- [ ] Course creation wizard guides through all required fields with validation
- [ ] Module drag-and-drop reorders lessons with auto-save
- [ ] Video upload shows progress bar and generates thumbnail automatically
- [ ] Prerequisite enforcement prevents enrollment if requirements not met
- [ ] Course publishing creates snapshot version preserving all content
- [ ] Draft changes visible to instructor but not students until published

## Dependencies
- None (foundational feature)

## Estimated Complexity
**High** - Requires rich course builder UI with drag-and-drop, media upload and storage with transcoding for video, prerequisite validation logic, versioning system, and content hierarchy management.`,
      tags: ["frontend", "backend", "api", "database", "ui"],
    },
  });
  allFeatures.push(lms1);

  const lms2 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project5.id,
      title: "Student Enrollment & Progress Tracking",
      description: `## Overview
Implement student enrollment system with self-enrollment, admin enrollment, progress tracking, completion certificates, and learning path recommendations.

## User Stories
- As a student, I want to enroll in courses so that I can start learning
- As a student, I want to track my progress so that I know how much I've completed
- As an instructor, I want to see student progress so that I can provide support

## Functional Requirements
1. The system shall support self-enrollment via course catalog with approval workflow option
2. The system shall track lesson completion with progress percentage per module and course
3. The system must issue completion certificates with unique verification codes
4. The application should recommend courses based on completed courses and interests
5. The system shall display learning paths showing prerequisite chains
6. The system must maintain enrollment history with start date, completion date, and grade

## Technical Requirements
- **Stack**: React progress dashboard, PDF certificate generation (PDFKit), Node.js recommendation engine
- **Database**: Enrollment, Progress, Certificate tables with student and course foreign keys
- **APIs**: POST /courses/:id/enroll, GET /students/:id/progress, POST /certificates/generate, GET /recommendations
- **Security**: Student-specific progress data, certificate verification with blockchain or secure hash
- **Performance**: Progress calculation < 500ms, certificate generation < 2s, recommendation < 1s

## Acceptance Criteria
- [ ] Course enrollment adds student to course with "In Progress" status
- [ ] Progress bar updates in real-time as lessons marked complete
- [ ] Certificate generated upon 100% completion with student name and completion date
- [ ] Recommendations show 5 relevant courses based on learning history
- [ ] Learning path visualization displays prerequisite tree with completed courses highlighted
- [ ] Enrollment history shows all courses with status (In Progress, Completed, Dropped)

## Dependencies
- Course Creation & Management (courses must exist to enroll)

## Estimated Complexity
**Medium** - Requires progress tracking logic with percentage calculations, PDF certificate generation with templates, recommendation algorithm, learning path visualization, and enrollment workflow management.`,
      tags: ["backend", "api", "database", "frontend", "pdf"],
    },
  });
  allFeatures.push(lms2);

  const lms3 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project5.id,
      title: "Interactive Video Player",
      description: `## Overview
Build a custom video player with interactive elements (quizzes, hotspots, branching), playback speed control, captions, note-taking, and watch time analytics.

## User Stories
- As a student, I want interactive quizzes in videos so that I can test my understanding
- As a student, I want to take notes while watching so that I can review later
- As an instructor, I want to see watch time so that I know if students are engaged

## Functional Requirements
1. The system shall provide video player with playback controls (play, pause, seek, speed, fullscreen)
2. The system shall support interactive overlays (quiz questions, clickable hotspots, info cards)
3. The system must display closed captions/subtitles with multi-language support
4. The application should allow in-video note-taking with timestamp linking
5. The system shall track watch time, completion rate, and rewatch patterns per student
6. The system must resume playback from last watched position across devices

## Technical Requirements
- **Stack**: React video player (Video.js or Plyr), WebVTT for captions, Node.js analytics tracking
- **Database**: VideoProgress, VideoNote, VideoInteraction tables with timestamp indexing
- **APIs**: GET /videos/:id/stream, POST /videos/:id/progress, POST /videos/:id/notes, GET /videos/:id/analytics
- **Security**: Signed URLs for video streaming, DRM for premium content, student-specific progress
- **Performance**: Video streaming with adaptive bitrate (HLS/DASH), buffer < 2s, note save < 100ms

## Acceptance Criteria
- [ ] Video player loads and starts playing within 2 seconds
- [ ] Interactive quiz pauses video and requires answer before continuing
- [ ] Captions display synchronized with audio with toggle on/off
- [ ] Note-taking panel allows typing with timestamp auto-insertion
- [ ] Watch time analytics show heatmap of most-watched segments
- [ ] Resume playback starts exactly where student left off on any device

## Dependencies
- Course Creation & Management (videos part of course content)
- Student Enrollment & Progress Tracking (progress updates)

## Estimated Complexity
**High** - Requires custom video player implementation with interactive overlay system, caption synchronization, note-taking with timestamp linking, watch time analytics with heatmap visualization, and cross-device playback resumption.`,
      tags: ["frontend", "backend", "api", "video", "analytics"],
    },
  });
  allFeatures.push(lms3);

  const lms4 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project5.id,
      title: "Quiz & Assessment Engine",
      description: `## Overview
Create a comprehensive assessment system with multiple question types, randomization, time limits, auto-grading, manual grading, and detailed performance analytics.

## User Stories
- As an instructor, I want to create quizzes so that I can assess student learning
- As a student, I want immediate feedback so that I know what I got wrong
- As an instructor, I want to analyze quiz results so that I can identify knowledge gaps

## Functional Requirements
1. The system shall support multiple question types (multiple choice, true/false, short answer, essay, matching, fill-in-blank)
2. The system shall provide question randomization and answer choice shuffling
3. The system must support timed quizzes with auto-submit at time expiration
4. The application should auto-grade objective questions (MC, T/F, matching) instantly
5. The system shall allow manual grading for subjective questions (essay, short answer) with rubrics
6. The system must display detailed results (score, correct answers, explanations, time spent per question)

## Technical Requirements
- **Stack**: React quiz UI with timer, Node.js grading engine, PostgreSQL for question bank
- **Database**: Quiz, Question, Answer, Submission, Grade tables with quiz-student relationships
- **APIs**: POST /quizzes/create, POST /quizzes/:id/submit, PUT /submissions/:id/grade, GET /quizzes/:id/analytics
- **Security**: Quiz access control (enrolled students only), answer encryption, anti-cheating measures (tab switching detection)
- **Performance**: Auto-grading < 1s for 50 questions, quiz load < 800ms, submission save < 500ms

## Acceptance Criteria
- [ ] Quiz creation supports all question types with rich text editor for formatting
- [ ] Randomization creates unique quiz versions for each student
- [ ] Timer displays countdown and auto-submits when time expires
- [ ] Auto-grading provides instant score with correct/incorrect indicators
- [ ] Manual grading interface shows student answer with rubric scoring guide
- [ ] Analytics dashboard shows question difficulty (% correct) and score distribution

## Dependencies
- Course Creation & Management (quizzes part of course content)
- Student Enrollment & Progress Tracking (quiz results update progress)

## Estimated Complexity
**High** - Requires multi-question-type system with rendering and validation, randomization algorithms, timer implementation with auto-submit, auto-grading engine, manual grading workflow with rubrics, and comprehensive analytics.`,
      tags: ["backend", "frontend", "api", "database", "analytics"],
    },
  });
  allFeatures.push(lms4);

  const lms5 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project5.id,
      title: "Assignment Submission & Grading",
      description: `## Overview
Build an assignment management system with submission uploads, plagiarism detection, rubric-based grading, peer review, and feedback delivery.

## User Stories
- As a student, I want to submit assignments so that I can complete coursework
- As an instructor, I want rubric grading so that I can provide consistent evaluations
- As an instructor, I want plagiarism detection so that I can ensure academic integrity

## Functional Requirements
1. The system shall allow file uploads for assignment submissions (PDF, DOCX, ZIP) with 100MB limit
2. The system shall integrate plagiarism detection API (Turnitin or Copyscape) with similarity reports
3. The system must support rubric-based grading with criterion scoring and total calculation
4. The application should enable peer review assignments with anonymous evaluation
5. The system shall provide rich text feedback with inline comments and file annotations
6. The system must track submission history with timestamps and resubmission support (if allowed)

## Technical Requirements
- **Stack**: React file upload with drag-and-drop, plagiarism API integration, PDF annotation library
- **Database**: Assignment, Submission, Grade, PeerReview, Rubric tables with relationships
- **APIs**: POST /assignments/:id/submit, POST /submissions/:id/check-plagiarism, PUT /submissions/:id/grade, POST /peer-reviews
- **Security**: Submission ownership validation, plagiarism report access control, file virus scanning
- **Performance**: File upload < 30s for 100MB, plagiarism check < 2min, grading save < 500ms

## Acceptance Criteria
- [ ] File upload shows progress bar and supports drag-and-drop
- [ ] Plagiarism report displays similarity percentage with highlighted matching text
- [ ] Rubric grading allows scoring each criterion with auto-calculation of total grade
- [ ] Peer review assigns random submissions anonymously with evaluation form
- [ ] Feedback includes rich text comments with attachments and PDF annotations
- [ ] Resubmission creates new version while preserving previous submissions

## Dependencies
- Course Creation & Management (assignments part of course content)
- Student Enrollment & Progress Tracking (assignment grades update progress)

## Estimated Complexity
**High** - Requires file upload with progress tracking, plagiarism API integration with report parsing, rubric grading system with calculations, peer review assignment algorithm, PDF annotation capabilities, and version control for resubmissions.`,
      tags: ["backend", "api", "integration", "frontend", "database"],
    },
  });
  allFeatures.push(lms5);

  const lms6 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project5.id,
      title: "Discussion Forums & Collaboration",
      description: `## Overview
Implement discussion forums with threaded conversations, moderation tools, upvoting, best answer selection, and real-time notifications.

## User Stories
- As a student, I want to ask questions so that I can get help from peers and instructors
- As an instructor, I want to moderate discussions so that I can maintain quality
- As a student, I want to upvote helpful answers so that good content is highlighted

## Functional Requirements
1. The system shall provide threaded discussion forums organized by course and topic
2. The system shall support rich text posts with code syntax highlighting and media embeds
3. The system must allow upvoting/downvoting posts with reputation score tracking
4. The application should enable instructors to mark "best answer" with visual highlighting
5. The system shall provide moderation tools (edit, delete, lock, pin, report inappropriate content)
6. The system must send real-time notifications for replies, mentions, and best answer selections

## Technical Requirements
- **Stack**: React forum UI, rich text editor (Quill), WebSocket for real-time updates, Node.js backend
- **Database**: Forum, Thread, Post, Vote tables with nested set model for threading
- **APIs**: POST /forums/:id/threads, POST /threads/:id/reply, PUT /posts/:id/vote, PUT /posts/:id/mark-best-answer
- **Security**: Course enrollment validation for forum access, spam detection, moderation logging
- **Performance**: Forum load < 1s, threaded replies render < 500ms, real-time notifications < 1s latency

## Acceptance Criteria
- [ ] Discussion forum displays threads with reply count and last activity timestamp
- [ ] Rich text editor supports formatting, code blocks, and image uploads
- [ ] Upvote/downvote updates score immediately with user reputation calculation
- [ ] Best answer marked with checkmark icon and floats to top of thread
- [ ] Moderation actions (delete, lock) take effect immediately with reason logged
- [ ] Notifications appear in real-time when @mentioned or replied to

## Dependencies
- Course Creation & Management (forums associated with courses)
- Student Enrollment & Progress Tracking (forum access based on enrollment)

## Estimated Complexity
**Medium** - Requires threaded discussion UI with nested replies, rich text editing with code highlighting, voting system with reputation tracking, real-time notifications via WebSocket, and comprehensive moderation tools.`,
      tags: ["frontend", "backend", "realtime", "collaboration", "websocket"],
    },
  });
  allFeatures.push(lms6);

  const lms7 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project5.id,
      title: "Live Virtual Classroom",
      description: `## Overview
Integrate live virtual classroom with video conferencing, screen sharing, interactive whiteboard, breakout rooms, polls, and session recording.

## User Stories
- As an instructor, I want to conduct live classes so that I can teach in real-time
- As a student, I want to participate in live sessions so that I can ask questions immediately
- As an instructor, I want breakout rooms so that I can facilitate group activities

## Functional Requirements
1. The system shall provide WebRTC-based video conferencing with up to 50 participants
2. The system shall support screen sharing by instructor and students (with permission)
3. The system must include interactive whiteboard with drawing tools and shape library
4. The application should enable breakout rooms with automatic or manual assignment
5. The system shall provide live polls and quizzes with real-time result visualization
6. The system must record sessions with cloud storage and automatic transcription

## Technical Requirements
- **Stack**: WebRTC (Jitsi or Twilio Video), React whiteboard (Excalidraw), WebSocket for polls
- **Database**: LiveSession, SessionRecording, Breakout, Poll tables with session relationships
- **APIs**: POST /sessions/create, POST /sessions/:id/start-recording, POST /breakouts/create, POST /polls
- **Security**: Session access control (enrolled students only), end-to-end encryption for video
- **Performance**: Video latency < 200ms, whiteboard sync < 100ms, recording processing < 10min for 1hr session

## Acceptance Criteria
- [ ] Live session starts with video/audio for all participants within 5 seconds
- [ ] Screen sharing displays presenter's screen with minimal latency
- [ ] Whiteboard allows drawing with real-time sync across all participants
- [ ] Breakout rooms automatically created and students assigned with timer
- [ ] Poll results display as horizontal bar chart updating in real-time
- [ ] Session recording available within 10 minutes of session end with searchable transcript

## Dependencies
- Course Creation & Management (live sessions part of course schedule)
- Student Enrollment & Progress Tracking (session attendance tracking)

## Estimated Complexity
**High** - Requires WebRTC implementation with multi-party video conferencing, screen sharing, collaborative whiteboard with real-time sync, breakout room management, live polling system, and session recording with transcription.`,
      tags: ["realtime", "frontend", "backend", "webrtc", "collaboration"],
    },
  });
  allFeatures.push(lms7);

  const lms8 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project5.id,
      title: "Gradebook & Performance Analytics",
      description: `## Overview
Build a comprehensive gradebook with grade calculations, weighted categories, grade curves, performance analytics, and parent/student access.

## User Stories
- As an instructor, I want a gradebook so that I can track all student grades in one place
- As a student, I want to see my grades so that I know my current standing
- As a parent, I want to monitor my child's progress so that I can provide support

## Functional Requirements
1. The system shall provide gradebook with all assignments, quizzes, and assessments
2. The system shall support weighted grade categories (assignments 40%, quizzes 30%, exams 30%)
3. The system must calculate letter grades with configurable grading scale (A=90-100, B=80-89, etc.)
4. The application should apply grade curves with multiple methods (linear, square root, flat)
5. The system shall display performance analytics (grade trends, class average, percentile rank)
6. The system must allow parent access to student grades with permission grants

## Technical Requirements
- **Stack**: React gradebook table with sorting/filtering, Chart.js for grade trends, Node.js calculation engine
- **Database**: Grade, GradeCategory, GradingScale tables with course configuration
- **APIs**: GET /courses/:id/gradebook, PUT /grades/:id, POST /grades/apply-curve, GET /students/:id/analytics
- **Security**: Role-based access (instructor, student, parent), grade encryption
- **Performance**: Gradebook load < 2s for 100 students, grade calculation < 500ms, analytics < 1s

## Acceptance Criteria
- [ ] Gradebook displays all assessments with student scores in grid format
- [ ] Weighted categories calculate correctly with total grade percentage
- [ ] Letter grade assignment uses configured scale with borderline rounding rules
- [ ] Grade curve application shows before/after distribution histogram
- [ ] Performance analytics show grade trend line over time with projections
- [ ] Parent view displays child's grades with limited editing permissions

## Dependencies
- Quiz & Assessment Engine (quiz grades)
- Assignment Submission & Grading (assignment grades)

## Estimated Complexity
**Medium** - Requires complex grade calculation engine with weighted categories, curve algorithms, gradebook UI with inline editing, performance analytics with trend visualization, and parent access control implementation.`,
      tags: ["backend", "frontend", "api", "analytics", "database"],
    },
  });
  allFeatures.push(lms8);

  const lms9 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project5.id,
      title: "Gamification & Achievements",
      description: `## Overview
Implement gamification system with points, badges, leaderboards, streaks, challenges, and rewards to increase student engagement and motivation.

## User Stories
- As a student, I want to earn badges so that I feel recognized for my achievements
- As a student, I want to see leaderboards so that I can compete with peers
- As an instructor, I want to create challenges so that I can motivate students

## Functional Requirements
1. The system shall award points for activities (completing lessons, quizzes, discussions, assignments)
2. The system shall provide 50+ badges with unlock criteria (first quiz, 10-day streak, perfect score)
3. The system must display leaderboards (all-time, monthly, course-specific) with rankings
4. The application should track learning streaks with visual streak calendar
5. The system shall enable custom challenges created by instructors with rewards
6. The system must allow points redemption for rewards (certificates, profile customizations, bonus content)

## Technical Requirements
- **Stack**: React gamification UI with animations, Node.js achievement engine, Redis for leaderboards
- **Database**: Achievement, Badge, Points, Streak, Challenge tables with student progress
- **APIs**: GET /achievements, POST /badges/:id/unlock, GET /leaderboards, POST /challenges
- **Security**: Anti-gaming measures (rate limiting on point earning), achievement verification
- **Performance**: Leaderboard calculation < 500ms using Redis sorted sets, badge unlock check < 100ms

## Acceptance Criteria
- [ ] Points awarded immediately after activity with animated notification
- [ ] Badge unlock displays congratulations modal with badge image and description
- [ ] Leaderboard shows top 10 students with profile pictures and point totals
- [ ] Streak calendar highlights consecutive days with flame icon
- [ ] Challenge creation allows setting goals, deadlines, and point rewards
- [ ] Points redemption updates student account and unlocks rewards

## Dependencies
- Student Enrollment & Progress Tracking (activity tracking)
- Course Creation & Management (course-specific achievements)

## Estimated Complexity
**Medium** - Requires achievement engine with unlock criteria evaluation, leaderboard system with Redis, streak tracking with calendar visualization, challenge creation workflow, and points/rewards economy implementation.`,
      tags: ["frontend", "backend", "api", "gamification", "engagement"],
    },
  });
  allFeatures.push(lms9);

  const lms10 = await db.feature.create({
    data: {
      id: uuid(),
      projectId: project5.id,
      title: "AI-Powered Learning Assistant",
      description: `## Overview
Develop an AI chatbot assistant providing instant answers to course questions, personalized study recommendations, auto-generated summaries, and adaptive learning paths.

## User Stories
- As a student, I want to ask questions to an AI so that I can get instant help 24/7
- As a student, I want personalized recommendations so that I can focus on weak areas
- As an instructor, I want auto-generated summaries so that I can create study guides quickly

## Functional Requirements
1. The system shall provide AI chatbot answering course-related questions using RAG (Retrieval-Augmented Generation)
2. The system shall analyze student performance to recommend topics for review
3. The system must auto-generate lesson summaries and key takeaways
4. The application should create adaptive learning paths adjusting difficulty based on performance
5. The system shall provide instant feedback on practice problems with step-by-step explanations
6. The system must support natural language queries about course content and schedules

## Technical Requirements
- **Stack**: OpenAI GPT-4 or Claude, vector database for RAG (Pinecone or Weaviate), React chat UI
- **Database**: ChatHistory, Recommendation, Summary tables with student context
- **APIs**: POST /ai/chat, GET /ai/recommendations, POST /ai/summarize, GET /ai/learning-path
- **Security**: Student context isolation, rate limiting on AI calls, content filtering
- **Performance**: Chat response < 3s, recommendations < 2s, summary generation < 5s for 5000 words

## Acceptance Criteria
- [ ] Chatbot answers course questions accurately using course materials as context
- [ ] Recommendations identify weak topics based on quiz/assignment performance
- [ ] Auto-generated summaries capture key concepts in bullet point format
- [ ] Adaptive path adjusts next lesson difficulty based on comprehension scores
- [ ] Practice problem feedback explains correct answer with step-by-step reasoning
- [ ] Natural language query "When is my next assignment due?" returns accurate date

## Dependencies
- Course Creation & Management (course content for RAG)
- Student Enrollment & Progress Tracking (performance data for recommendations)
- Quiz & Assessment Engine (assessment data for adaptive paths)

## Estimated Complexity
**High** - Requires LLM integration with RAG architecture, vector database for semantic search, performance analysis algorithms for recommendations, adaptive learning path engine, and conversational AI with context management.`,
      tags: ["ai", "backend", "api", "nlp", "ml"],
    },
  });
  allFeatures.push(lms10);

  console.log("✓ Created 50 features across 5 projects");

  // ============================================
  // CREATE ASSIGNMENTS
  // ============================================

  // Distribute 50 features across 4 students with realistic status distribution
  const students = [student1, student2, student3, student4];
  const statuses = [
    Status.Backlog, Status.Backlog, Status.Backlog, // 30% Backlog
    Status.Todo, Status.Todo, Status.Todo, // 30% Todo
    Status.InProgress, Status.InProgress, // 20% InProgress
    Status.Done, Status.Done, // 15% Done
    Status.Canceled, // 5% Canceled
  ];

  // Helper to get project for each feature
  const getProjectForFeature = (index: number) => {
    if (index < 10) return project1;
    if (index < 20) return project2;
    if (index < 30) return project3;
    if (index < 40) return project4;
    return project5;
  };

  for (let i = 0; i < allFeatures.length; i++) {
    const feature = allFeatures[i];
    const student = students[i % students.length]; // Round-robin assignment
    const status = statuses[i % statuses.length]; // Cycle through statuses
    const project = getProjectForFeature(i);

    await db.assignment.create({
      data: {
        id: uuid(),
        projectId: project.id,
        featureId: feature.id,
        studentId: student.id,
        status: status,
      },
    });
  }

  console.log("✓ Created 50 assignments distributed across 4 students");

  // ============================================
  // SUMMARY
  // ============================================

  console.log("\n========================================");
  console.log("🎉 Seed completed successfully!");
  console.log("========================================\n");
  console.log("Demo Accounts (password: password123):");
  console.log("----------------------------------------");
  console.log("Admin:   admin@demo.com");
  console.log("PM:      pm@demo.com");
  console.log("Student: alice@demo.com (Batch 2024-A)");
  console.log("Student: bob@demo.com (Batch 2024-A)");
  console.log("Student: carol@demo.com (Batch 2024-B)");
  console.log("Student: david@demo.com (Batch 2024-B)");
  console.log("----------------------------------------");
  console.log(`\nOrg URL: /demo-academy`);
  console.log(`Batch URLs:`);
  console.log(`  - /demo-academy/batch-2024-a`);
  console.log(`  - /demo-academy/batch-2024-b`);
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
