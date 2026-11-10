// Fictional-but-recognizable landscape for the keynote demo.
// Direction: every dependency reads "dependent REQUIRES required".
//
// Designed-in scenarios:
// - identity-api: shared service with many direct and indirect dependents.
// - diamond: customer-portal -> checkout-service -> identity-api AND customer-portal -> orders-api -> identity-api
//   (also checkout-service -> orders-api), so identity-api outage must count customer-portal once.
// - cycle: legacy-crm <-> crm-sync-job (safe traversal).
// - independent: intranet-wiki (no edges), hr-portal/hr-db cluster (not connected to the main graph).
// - owner: null => "no business owner" (used by the live-coding enhancement).

export const owners = {
  // alias -> preferred user principal name prefix (matched case-insensitively against systemuser.domainname)
  adele: "AdeleV@",
  alex: "AlexW@",
  megan: "MeganB@",
  diego: "DiegoS@",
  joni: "JoniS@",
  grady: "GradyA@",
  hugo: "hugo@",
  carmen: "carmen@",
  luise: "luisefreese@",
};

export const assets = [
  // key, name, type, criticality, owner alias | null, description
  ["customer-portal", "Customer Portal", "Application", "High", "adele", "Public web shop where customers browse, order and track."],
  ["mobile-app", "Mobile App", "Application", "High", "alex", "iOS/Android companion app for the shop."],
  ["partner-portal", "Partner Portal", "Application", "Medium", "megan", "B2B portal for resellers to place bulk orders."],
  ["admin-console", "Admin Console", "Application", "Medium", null, "Internal back-office for support agents."],
  ["reporting-portal", "Reporting Portal", "Application", "Medium", "luise", "Dashboards for management."],
  ["etl-pipeline", "ETL Pipeline", "Application", "Medium", null, "Nightly jobs that load operational data into the warehouse."],
  ["hr-portal", "HR Portal", "Application", "Low", "megan", "Employee self-service for leave and payslips."],
  ["intranet-wiki", "Intranet Wiki", "Application", "Low", null, "Standalone knowledge base."],
  ["legacy-crm", "Legacy CRM", "Application", "Low", null, "Old on-prem CRM kept alive for the sales team."],
  ["crm-sync-job", "CRM Sync Job", "Application", "Low", null, "Bi-directional sync between Legacy CRM and the customer database."],

  ["checkout-service", "Checkout Service", "API", "High", "diego", "Orchestrates cart, pricing, tax and payment."],
  ["orders-api", "Orders API", "API", "High", "joni", "Creates and tracks orders."],
  ["identity-api", "Identity API", "API", "High", "grady", "Single sign-on and token issuing for every channel."],
  ["catalog-api", "Catalog API", "API", "Medium", "hugo", "Product data for all channels."],
  ["pricing-api", "Pricing API", "API", "Medium", null, "Calculates list and promotional prices."],
  ["inventory-api", "Inventory API", "API", "High", "carmen", "Stock levels and reservations."],
  ["shipping-api", "Shipping API", "API", "Medium", null, "Delivery options and labels."],
  ["notification-service", "Notification Service", "API", "Low", "megan", "Sends e-mails and SMS to customers."],
  ["search-service", "Search Service", "API", "Medium", "alex", "Full-text product search."],
  ["recommendation-engine", "Recommendation Engine", "API", "Low", null, "Personalised product suggestions."],
  ["feature-flags", "Feature Flag Service", "API", "Medium", "grady", "Runtime feature toggles for the web channels."],

  ["orders-db", "Orders Database", "Database", "High", "joni", "System of record for orders."],
  ["inventory-db", "Inventory Database", "Database", "High", "carmen", "Stock positions per warehouse."],
  ["customer-db", "Customer Database", "Database", "High", "adele", "Customer master data and credentials."],
  ["catalog-db", "Catalog Database", "Database", "Medium", "hugo", "Products, categories, media."],
  ["analytics-warehouse", "Analytics Warehouse", "Database", "Medium", null, "Star schema for reporting."],
  ["hr-db", "HR Database", "Database", "Medium", "megan", "Employee records."],

  ["payment-provider", "Payment Provider (PayFlow)", "External Service", "High", "diego", "Card and wallet payments."],
  ["tax-service", "Tax Calculation Service", "External Service", "Medium", "diego", "VAT/sales tax rates per jurisdiction."],
  ["email-gateway", "Email Gateway", "External Service", "Low", "megan", "Transactional e-mail delivery."],
  ["sms-gateway", "SMS Gateway", "External Service", "Low", null, "Transactional SMS delivery."],
  ["maps-api", "Maps Provider", "External Service", "Low", null, "Geocoding and route estimates."],
];

// [dependent, required]
export const dependencies = [
  ["customer-portal", "identity-api"],
  ["customer-portal", "catalog-api"],
  ["customer-portal", "checkout-service"],
  ["customer-portal", "orders-api"],
  ["customer-portal", "search-service"],
  ["customer-portal", "recommendation-engine"],
  ["customer-portal", "feature-flags"],
  ["mobile-app", "identity-api"],
  ["mobile-app", "catalog-api"],
  ["mobile-app", "checkout-service"],
  ["mobile-app", "orders-api"],
  ["mobile-app", "notification-service"],
  ["mobile-app", "feature-flags"],
  ["partner-portal", "identity-api"],
  ["partner-portal", "orders-api"],
  ["partner-portal", "inventory-api"],
  ["admin-console", "identity-api"],
  ["admin-console", "orders-api"],
  ["admin-console", "inventory-api"],
  ["checkout-service", "identity-api"],
  ["checkout-service", "pricing-api"],
  ["checkout-service", "payment-provider"],
  ["checkout-service", "tax-service"],
  ["checkout-service", "orders-api"],
  ["orders-api", "identity-api"],
  ["orders-api", "orders-db"],
  ["orders-api", "inventory-api"],
  ["orders-api", "shipping-api"],
  ["catalog-api", "catalog-db"],
  ["pricing-api", "catalog-db"],
  ["inventory-api", "inventory-db"],
  ["inventory-api", "identity-api"],
  ["shipping-api", "maps-api"],
  ["shipping-api", "inventory-api"],
  ["notification-service", "email-gateway"],
  ["notification-service", "sms-gateway"],
  ["notification-service", "customer-db"],
  ["search-service", "catalog-db"],
  ["recommendation-engine", "analytics-warehouse"],
  ["identity-api", "customer-db"],
  ["reporting-portal", "analytics-warehouse"],
  ["reporting-portal", "identity-api"],
  ["etl-pipeline", "orders-db"],
  ["etl-pipeline", "inventory-db"],
  ["etl-pipeline", "customer-db"],
  ["analytics-warehouse", "etl-pipeline"],
  ["hr-portal", "hr-db"],
  ["legacy-crm", "crm-sync-job"],
  ["crm-sync-job", "legacy-crm"],
  ["crm-sync-job", "customer-db"],
];
