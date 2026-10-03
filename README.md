# LaysanX Atlas

Atlas is a free, MIT-licensed reference theme from Laysan Technologies for
LaysanX tenant websites and storefronts. It demonstrates how to build an
uploaded theme using HTML templates, reusable sections, CSS, JavaScript, and
backend-provided content. You can restyle or extend it without editing the
LaysanX application.

Atlas is **not** a standalone static website. The LaysanX theme renderer fills
its Liquid-like placeholders, chooses the page template, supplies tenant data,
and handles forms, accounts, cart, checkout, and payments. Opening an HTML file
directly in a browser will not show a working site. The syntax is a supported
Liquid-like subset, not a promise of full Liquid compatibility.

## Quick start

1. Choose **Code > Download ZIP** here, or download the
   [import-ready release ZIP](https://github.com/LaysanX/atlas-theme/releases/latest/download/laysanx-atlas-v2.0.0.zip).
2. In LaysanX Client Admin, open **Appearance & Themes** and upload the ZIP
   directly. Do not unpack or repackage the GitHub ZIP.
3. Review the theme security audit, preview the theme, and publish it when
   ready. Commerce and customer-account pages also need their respective
   theme-page options enabled if you want Atlas to render those routes.
4. Configure content, menus, forms, section visibility/order, and commerce in
   Client Admin. The theme displays that data; it does not create it.

## Package layout

```text
atlas-theme/
  theme.json                 # name, version, template map, section schemas
  README.md                  # developer guide
  LICENSE.md                 # MIT license; .md is accepted by the uploader
  templates/                # complete page layouts
  sections/                 # shared and page-specific partials
  assets/css/style.css      # visual styles
  assets/js/main.js         # interactive behavior
```

The [manifest](theme.json) is the source of truth for the 38 registered page
templates and 31 declared section schemas. There are additional helper
partials in `sections/`. Keep manifest paths and files in sync if you rename
or add templates.

## Page coverage

| Area | Atlas templates |
| --- | --- |
| Website | `home`, `page`, `custom-section-detail`, `contact` |
| Content | service, product, project, blog, news, event, job, and team list/detail pages; career, FAQ, gallery, pricing, and notifications |
| Commerce | `cart`, `checkout`, `order-success`, `orders`, `returns` |
| Customer | `customer-account`, `customer-profile`, `customer-orders`, `customer-addresses`, `customer-wishlist`, `customer-change-password` |

Product collections use `templates/product-list.html` with collection/filter
data from the backend. Login, registration, password recovery, and logout are
platform-managed routes rather than Atlas template files. Use supplied URLs
such as `ecommerce.urls.login` and `ecommerce.urls.register`; do not hard-code
tenant paths. The commerce and customer templates are selected only when the
corresponding theme-page options are enabled in LaysanX.

## Runtime data and placeholders

The renderer supplies shared objects plus route-specific data. Read the
existing templates for field names and null/empty guards before adding a new
section. Common objects include:

| Object | Purpose |
| --- | --- |
| `site`, `seo`, `settings` | Tenant identity, metadata, layout/settings |
| `menus.header`, `menus.footer`, `routes` | Navigation and tenant-aware URLs |
| `home`, `page`, `section_controls` | Enabled sections, order, headings, counts, page content |
| `listing_products`, `product`, `product_filters` | Product cards, detail/variants, collection filters |
| `ecommerce`, `cart`, `checkout`, `customer_orders` | Storefront state and actions on relevant routes |
| `forms.contact`, `forms.antiforgery_field` | Assigned forms and POST protection |

Examples already used in Atlas:

```liquid
{{ seo.title | default: site.name }}
{{ 'assets/css/style.css' | asset_url }}

{% for item in menus.header %}
  <a href="{{ item.url }}">{{ item.title }}</a>
{% endfor %}

{% for ordered_section in home.ordered_sections %}
  {% if ordered_section.type == 'services' and home.services_active %}
    {% render 'sections/services.html', services: homepage_services, section: section_controls.services %}
  {% endif %}
{% endfor %}
```

Keep `home.ordered_sections` and `page.ordered_sections` when changing layouts.
These collections reflect admin ordering and enabled sections, including
marketing/auxiliary sections and dynamic-page blocks. Check the relevant
active flag and data collection before rendering. Do not add hard-coded sample
cards or show a section merely because its data exists: disabled content must
remain hidden. Use the backend-provided image URLs, labels, links, and
formatted prices instead of fixed demo values.

## Forms and secure actions

For assigned contact/inline forms, keep the backend-supplied `submit_url`,
`fields`, generated `input_html`, `formId`, and conditional CAPTCHA. See
`sections/contact-form.html` and `sections/inline-form.html`; do not replace
dynamic fields with a hard-coded contact form. POST forms must retain the
existing antiforgery field:

```liquid
<form method="post" action="{{ forms.contact.submit_url }}" enctype="multipart/form-data">
  {{ forms.antiforgery_field | raw }}
  <input type="hidden" name="formId" value="{{ forms.contact.id }}">
  {% for field in forms.contact.fields %}
    {{ field.input_html | raw }}
  {% endfor %}
</form>
```

Cart, coupon, checkout, wishlist, address, profile, and other POST actions
also need their existing action URLs, input names, hidden IDs, and antiforgery
field. Use `| raw` only for HTML intentionally supplied by the trusted
LaysanX renderer (such as the token or generated form controls); escape
ordinary text and attribute values as appropriate. Never put API secret keys,
payment secrets, or tenant credentials in theme files or browser JavaScript.

## Ecommerce and interactions

- Product listing and collections share `product-list.html`; keep search,
  sort, category/brand/attribute filters, and query field names working.
- Product images, galleries, variants, swatches, prices, and availability come
  from backend product data. Preserve `product.variant_groups`,
  `product.variant_payload_json`, variant IDs, and the `data-atlas-product-form`
  hooks used by `assets/js/main.js`.
- Keep `ecommerce.enabled` checks, `ecommerce.urls.*` links, cart actions,
  formatted currency values, and checkout gateway data. Do not show purchase
  controls when commerce is disabled.
- Keep gallery category/filter and lightbox hooks, navigation behavior, and
  accessible button labels when restyling interactive components.
- Payment selection and order totals are backend-driven. Never calculate a
  trusted checkout total or embed gateway credentials in the theme.

Templates load Bootstrap, icon fonts, and selected UI/payment scripts from
external CDNs. If your deployment requires offline assets or a stricter
content-security policy, vendor approved dependencies under `assets/` and
update their references; test the affected checkout and UI flows afterward.

## Safe customization

Change layout, typography, colors, spacing, images, card styles, and section
composition in `templates/`, `sections/`, `assets/css/style.css`, and
`assets/js/main.js`. When changing behavior, preserve:

- template and partial paths referenced by `theme.json` or `{% render %}`;
- object names, loop variables, section visibility/order checks, and
  tenant-aware route/asset URLs;
- form actions, antiforgery tokens, field names, IDs, and CAPTCHA handling;
- variant, gallery, cart, checkout, and customer-account JavaScript hooks;
- responsive layout, keyboard access, alt text, and visible focus styles.

HTML templates use two-space indentation. Keep Liquid tags as written: the
LaysanX renderer does not support whitespace-control delimiters such as
`{%-`, `-%}`, `{{-`, or `-}}`. A generic Liquid formatter may add them, so
check formatted templates before publishing.

Test both an empty module and a populated module. A missing image, section,
variant, or form may reflect missing backend data or a disabled admin setting,
not just CSS.

## Packaging and checks

GitHub's **Code > Download ZIP** is directly uploadable: LaysanX accepts its
single enclosing folder and finds `theme.json` inside it. The release ZIP is
also ready to upload. To package a local checkout yourself, run this in the
repository root:

```bash
zip -r atlas-theme.zip theme.json README.md LICENSE.md templates sections assets
unzip -t atlas-theme.zip
```

Keep only supported theme files. The uploader accepts HTML, CSS, JavaScript,
JSON, Markdown/text, common web images, and font files. It rejects files with
no extension (which is why the license is `LICENSE.md`), server-side code,
executables, and unsafe paths. Do not include `.git`, local configuration,
credentials, or generated downloads in the package.

Before sharing a change, preview at desktop and mobile widths and check: home
and dynamic-page section visibility/order; menus and CTAs; content listings
and detail images; gallery filters/lightbox; assigned forms and CAPTCHA;
product filters/variants; cart, coupon, checkout and payment; customer pages;
and empty/disabled states. Availability depends on the tenant's enabled
modules and configured backend data.

## License

Copyright (c) 2026 Laysan Technologies. Licensed under the
[MIT License](LICENSE.md).
