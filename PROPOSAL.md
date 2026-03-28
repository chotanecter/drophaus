# Web Development & Hosting Services Proposal

**Prepared for:** Drop Haus  
**Prepared by:** Matthew Cho  
**Date:** March 7, 2026  
**Proposal Reference:** DH-2026-001

---

## Executive Summary

This proposal outlines the web development and hosting services delivered for Drop Haus, a premium blank apparel manufacturer. The platform has been designed and built to serve as the company's primary digital presence, wholesale customer acquisition system, and brand collaboration showcase.

---

## Scope of Work Delivered

### 1. Public-Facing Website

A fully custom-built website featuring:

- **Home Page** — Brand hero section, product category navigation, feature highlights, and call-to-action sections
- **Product Catalog** — Filterable product catalog by category (T-Shirts, Hoodies, Sweats, Jackets) with individual product detail pages featuring size selection, color swatches, fabric specifications, and pricing
- **Collaborations Page** — Dedicated showcase for brand partnerships and collaborative collections with individual collection pages
- **About Page** — Company story, manufacturing process, and brand values
- **Contact Page** — Contact form with database-stored submissions

### 2. Wholesale Verification & Onboarding System

A complete wholesale customer acquisition pipeline:

- **Wholesale Application Form** — Public-facing form collecting:
  - Business Name
  - Business Type (Retailer, Online Store, Distributor, Other)
  - EIN Number
  - Resale Certificate Number
  - Contact Name, Email, and Phone Number
  - Business Address
  - Additional details and notes

- **Application Review Dashboard** — Admin panel for Drop Haus to:
  - View all incoming wholesale applications
  - Filter by status (Pending, Approved, Rejected)
  - Search by business name or contact info
  - Review full application details
  - Approve or reject with internal notes
  - Generate unique account creation links upon approval

- **Wholesale Account Creation** — Approved applicants receive a secure signup link to create their wholesale portal account

- **Wholesale Portal** — Authenticated access for approved accounts to view wholesale pricing and bulk pricing tiers

### 3. Administration Dashboard

A protected admin panel accessible at a secure URL, featuring:

- **Applications Management** — Full CRUD and review workflow
- **Products Management** — Product catalog administration
- **Collaborations Management** — Brand partnership administration
- **Accounts Management** — Wholesale account oversight

### 4. Integration Architecture

The platform has been built with integration-ready architecture for:

- **Shopify** — Service layer prepared for product synchronization, checkout/payment processing, and order management via Shopify Storefront and Admin APIs
- **ApparelMagic** — Service layer prepared for ERP integration including inventory synchronization, order fulfillment, customer CRM sync, and production tracking

### 5. Technical Specifications

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (React) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 |
| Hosting | Vercel |
| Authentication | Token-based (wholesale portal) |

---

## Pricing

### Website Development

| Item | Amount |
|------|--------|
| Custom website design & development (full scope as described above) | **$3,500.00** |

**Payment Terms:** Full payment due upfront prior to the transfer of code, credentials, and deployment access.

### Monthly Maintenance & Support Package

| Item | Details | Cost |
|------|---------|------|
| **Managed Hosting & Maintenance** | Comprehensive platform management, ongoing support, and collaboration site development (details below) | **$1,250.00/month** |

#### Included Services:

**Infrastructure & Hosting**
- Website hosting on Vercel's global edge network
- PostgreSQL database hosting and management via Neon
- SSL certificate (HTTPS) management and renewal
- Domain configuration and DNS management (domain registration costs, if any, are separate)
- Uptime monitoring and incident response

**Maintenance & Updates**
- Routine security updates and dependency patching (monthly)
- Performance monitoring and optimization
- Database backups and maintenance
- Bug fixes and troubleshooting for existing features
- Browser and device compatibility updates as needed

**Content & Platform Support**
- Assistance with product catalog updates and content changes
- Admin panel support and training as needed
- Analytics review and reporting (monthly summary)

**Collaboration Website Development**
- Design and development of **up to one (1) collaboration website per month** for Drop Haus brand partnerships
- Each collaboration site includes a custom landing page, product showcase, and branding tailored to the partnership
- Collaboration sites are hosted and maintained under the same infrastructure at no additional hosting cost
- Additional collaboration sites beyond the monthly allotment may be requested at a rate of **$500.00 per site**

**Support & Communication**
- Priority email and messaging support during business hours (Mon–Fri, 9 AM – 6 PM PST)
- Response within 24 hours for standard requests
- Response within 4 hours for critical issues (site down, security concerns)

### Media Content (Optional)

The development fee covers the design and build of the website only. The website currently uses placeholder imagery. For a launch-ready site, professional media content is recommended:

| Item | Includes | Amount |
|------|----------|--------|
| **Media Content Package** | Professional product photography, lifestyle imagery, and video content for the website — covering hero sections, product catalog, about page, and collaboration showcases | **$2,500.00** |

This is an optional add-on. Drop Haus may alternatively provide their own media assets for integration into the website at no additional cost.

---

## Maintenance & Support Agreement

### Term

This agreement covers a period of **one (1) year** from the date of execution, beginning on the date both parties sign this agreement. The monthly maintenance fee of **$1,250.00** is billed on the first of each month.

### What's Not Included

The following are outside the scope of the monthly maintenance package and will be quoted separately:

- Major feature development or platform redesigns
- Third-party integration implementation (Shopify, ApparelMagic) beyond the prepared architecture
- Third-party service subscription fees (Shopify plans, ApparelMagic licenses, etc.)
- Domain registration or renewal fees
- Professional photography, videography, or media production
- Collaboration sites beyond the one (1) per month allotment ($500.00 per additional site)

### Renewal & Renegotiation

Upon expiration of the initial one (1) year term, either party may propose revised terms for continued maintenance services. Both parties agree to enter renegotiation in good faith no later than thirty (30) days prior to the expiration of the current term. If no new agreement is reached, services will continue on a month-to-month basis under the existing terms until a new agreement is executed or services are terminated with thirty (30) days written notice.

---

## Design Finalization & Change Policy

### Design Approval Process

Upon delivery, Drop Haus will have a review period to request revisions and adjustments to the website design. Both parties will work collaboratively to reach a finalized design that meets Drop Haus's satisfaction.

### Post-Finalization Changes

Once both parties agree in writing (email confirmation is sufficient) that the website design is finalized:

- **Any subsequent design changes, feature additions, or modifications** to the website will be subject to a **$250.00 USD fee per change request**.
- A "change request" is defined as any modification to the website's layout, functionality, content structure, or styling that requires development work.
- Minor content updates (e.g., updating text, swapping product images, adding/removing products through the existing admin panel) are **not** considered change requests and can be performed by Drop Haus at no additional cost through the admin dashboard.
- Each change request will be scoped and confirmed before work begins.

---

## Intellectual Property & Ownership

### Full Ownership Transfer

Upon execution of this agreement, **Drop Haus shall own the entirety of the system**, including but not limited to:

- All source code, frontend and backend
- Database schema and structure
- Design assets, layouts, and styling
- API integrations and service architecture
- All documentation

Drop Haus will have full rights to modify, redistribute, or transfer the codebase at their discretion. A complete copy of the codebase and all credentials will be provided to Drop Haus upon request.

### Exclusions

The following are not included in the ownership transfer:
- Third-party service accounts (Vercel, Neon, Shopify, ApparelMagic) — these remain under whatever account holds them and can be transferred to Drop Haus-owned accounts upon request
- Open-source libraries and frameworks used in the project, which remain under their respective licenses

---

## Acceptance

By signing below, both parties agree to the terms outlined in this proposal.

&nbsp;

**Drop Haus**

| | |
|---|---|
| Signature: | ________________________________________ |
| Name: | ________________________________________ |
| Title: | ________________________________________ |
| Date: | ________________________________________ |

&nbsp;

**Matthew Cho**

| | |
|---|---|
| Signature: | ________________________________________ |
| Name: | Matthew Cho |
| Date: | ________________________________________ |

---

*This proposal is valid for thirty (30) days from the date of preparation.*
