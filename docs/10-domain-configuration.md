# Cấu hình Domain và Subdomain

## Tổng quan

Tài liệu này mô tả cách cấu hình domain và subdomain cho hệ thống SaaS multi-tenant, bao gồm DNS, SSL certificates, và reverse proxy configuration.

## Kiến trúc Domain

### 1. Domain Structure
```
Main Domain: zplus.vn
├── System Admin: zplus.vn/admin
├── Tenant Subdomains: {tenant}.zplus.vn
│   ├── Admin: {tenant}.zplus.vn/admin
│   └── Customer: {tenant}.zplus.vn/
└── Custom Domains: tenant-domain.com → {tenant}.zplus.vn
```

### 2. Domain Types

#### System Domain (zplus.vn)
- **Purpose**: System administration và landing page
- **Users**: Super admins, system managers
- **Routes**: 
  - `/` - Landing page
  - `/admin` - System administration
  - `/api/v1/system` - System API

#### Tenant Subdomains ({tenant}.zplus.vn)
- **Purpose**: Tenant-specific applications
- **Users**: Tenant admins, managers, customers
- **Routes**:
  - `/` - Customer interface
  - `/admin` - Tenant administration
  - `/api/v1` - Tenant API

#### Custom Domains (tenant-domain.com)
- **Purpose**: White-label solution
- **Mapping**: Custom domain → Tenant subdomain
- **SSL**: Separate certificates required

## DNS Configuration

### 1. Main Domain DNS
```bash
# DNS Records for zplus.vn
zplus.vn.           A     203.0.113.1
zplus.vn.           AAAA  2001:db8::1
www.zplus.vn.       CNAME zplus.vn.

# Wildcard for subdomains
*.zplus.vn.         A     203.0.113.1
*.zplus.vn.         AAAA  2001:db8::1

# MX records for email
zplus.vn.           MX    10 mail.zplus.vn.
mail.zplus.vn.      A     203.0.113.2

# TXT records
zplus.vn.           TXT   "v=spf1 include:_spf.google.com ~all"
_dmarc.zplus.vn.    TXT   "v=DMARC1; p=quarantine; rua=mailto:dmarc@zplus.vn"
```

### 2. Custom Domain Configuration
```bash
# Customer's domain DNS (tenant-domain.com)
tenant-domain.com.     CNAME  tenant1.zplus.vn.
www.tenant-domain.com. CNAME  tenant1.zplus.vn.

# Alternative: A record pointing to our server
tenant-domain.com.     A      203.0.113.1
www.tenant-domain.com. A      203.0.113.1
```

### 3. DNS Management Script
```bash
#!/bin/bash
# scripts/add-custom-domain.sh

TENANT_SUBDOMAIN=$1
CUSTOM_DOMAIN=$2

if [ -z "$TENANT_SUBDOMAIN" ] || [ -z "$CUSTOM_DOMAIN" ]; then
    echo "Usage: $0 <tenant_subdomain> <custom_domain>"
    exit 1
fi

echo "Adding custom domain $CUSTOM_DOMAIN for tenant $TENANT_SUBDOMAIN..."

# Add domain mapping to database
psql -h localhost -U postgres -d golang_saas -c "
INSERT INTO public.domain_mappings (domain, tenant_id, status) 
SELECT '$CUSTOM_DOMAIN', id, 'pending' 
FROM public.tenants 
WHERE subdomain = '$TENANT_SUBDOMAIN';
"

# Generate SSL certificate
certbot certonly --nginx -d $CUSTOM_DOMAIN -d www.$CUSTOM_DOMAIN

# Update Nginx configuration
./scripts/update-nginx-config.sh

echo "Custom domain $CUSTOM_DOMAIN added successfully!"
echo "Customer should set DNS records:"
echo "$CUSTOM_DOMAIN.     CNAME  $TENANT_SUBDOMAIN.zplus.vn."
echo "www.$CUSTOM_DOMAIN. CNAME  $TENANT_SUBDOMAIN.zplus.vn."
```

## SSL Certificate Management

### 1. Wildcard Certificate Setup
```bash
# Install certbot với DNS challenge plugin
sudo apt install certbot python3-certbot-nginx python3-certbot-dns-cloudflare

# Configure Cloudflare credentials
cat > /etc/letsencrypt/cloudflare.ini << EOF
dns_cloudflare_email = your-email@example.com
dns_cloudflare_api_key = your-api-key
EOF
chmod 600 /etc/letsencrypt/cloudflare.ini

# Obtain wildcard certificate
certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d zplus.vn \
  -d *.zplus.vn
```

### 2. Custom Domain SSL
```bash
#!/bin/bash
# scripts/setup-custom-domain-ssl.sh

CUSTOM_DOMAIN=$1

if [ -z "$CUSTOM_DOMAIN" ]; then
    echo "Usage: $0 <custom_domain>"
    exit 1
fi

echo "Setting up SSL for $CUSTOM_DOMAIN..."

# Verify domain ownership
if ! dig +short $CUSTOM_DOMAIN | grep -q "203.0.113.1"; then
    echo "Error: Domain $CUSTOM_DOMAIN does not point to our server"
    exit 1
fi

# Obtain certificate
certbot certonly \
  --nginx \
  --non-interactive \
  --agree-tos \
  --email admin@zplus.vn \
  -d $CUSTOM_DOMAIN \
  -d www.$CUSTOM_DOMAIN

if [ $? -eq 0 ]; then
    echo "SSL certificate obtained successfully"
    
    # Update domain status in database
    psql -h localhost -U postgres -d golang_saas -c "
    UPDATE public.domain_mappings 
    SET status = 'active', ssl_enabled = true 
    WHERE domain = '$CUSTOM_DOMAIN';
    "
    
    # Reload Nginx
    nginx -t && systemctl reload nginx
else
    echo "Failed to obtain SSL certificate"
    exit 1
fi
```

### 3. Auto-renewal Setup
```bash
# Add to crontab
sudo crontab -e

# Renew certificates twice daily
0 12 * * * /usr/bin/certbot renew --quiet
0 0 * * * /usr/bin/certbot renew --quiet

# Post-renewal hook
cat > /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF
chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
```

## Nginx Configuration

### 1. Main Configuration
```nginx
# /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for" '
                   'rt=$request_time uct="$upstream_connect_time" '
                   'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream servers
    upstream backend {
        server 127.0.0.1:3000;
        keepalive 32;
    }

    upstream frontend {
        server 127.0.0.1:3001;
        keepalive 32;
    }

    # Include site configurations
    include /etc/nginx/sites-enabled/*;
}
```

### 2. Main Domain Configuration
```nginx
# /etc/nginx/sites-available/zplus.vn
server {
    listen 80;
    server_name zplus.vn www.zplus.vn;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zplus.vn www.zplus.vn;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/zplus.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zplus.vn/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # System API routes
    location /api/v1/system {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend/api/v1/system;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Domain-Type "system";
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Auth routes with rate limiting
    location /api/v1/auth {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://backend/api/v1/auth;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend routes
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Domain-Type "system";
        
        # Handle WebSocket connections
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri @frontend;
    }

    location @frontend {
        proxy_pass http://frontend;
    }
}
```

### 3. Tenant Subdomain Configuration
```nginx
# /etc/nginx/sites-available/tenant-subdomains
server {
    listen 80;
    server_name ~^(?<tenant>.+)\.zplus\.vn$;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ~^(?<tenant>.+)\.zplus\.vn$;

    # SSL configuration (wildcard certificate)
    ssl_certificate /etc/letsencrypt/live/zplus.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zplus.vn/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Tenant API routes
    location /api/v1 {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend/api/v1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant $tenant;
        proxy_set_header X-Domain-Type "tenant";
    }

    # Frontend routes
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant $tenant;
        proxy_set_header X-Domain-Type "tenant";
        
        # Handle WebSocket connections
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 4. Custom Domain Configuration Template
```nginx
# /etc/nginx/templates/custom-domain.conf.template
server {
    listen 80;
    server_name ${CUSTOM_DOMAIN} www.${CUSTOM_DOMAIN};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${CUSTOM_DOMAIN} www.${CUSTOM_DOMAIN};

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/${CUSTOM_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${CUSTOM_DOMAIN}/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # API routes
    location /api/v1 {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend/api/v1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Custom-Domain ${CUSTOM_DOMAIN};
        proxy_set_header X-Domain-Type "custom";
    }

    # Frontend routes
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Custom-Domain ${CUSTOM_DOMAIN};
        proxy_set_header X-Domain-Type "custom";
    }
}
```

## Domain Management API

### 1. Domain Verification
```go
// backend/internal/services/domain_service.go
type DomainService struct {
    db     *gorm.DB
    logger *logrus.Logger
}

func (ds *DomainService) VerifyDomainOwnership(domain string) error {
    // Generate verification token
    token := generateVerificationToken()
    
    // Store token in database
    verification := &DomainVerification{
        Domain:    domain,
        Token:     token,
        Method:    "dns_txt",
        ExpiresAt: time.Now().Add(24 * time.Hour),
    }
    
    if err := ds.db.Create(verification).Error; err != nil {
        return err
    }
    
    // Check for TXT record
    txtRecord := fmt.Sprintf("zplus-verification=%s", token)
    records, err := net.LookupTXT(domain)
    if err != nil {
        return fmt.Errorf("failed to lookup TXT records: %w", err)
    }
    
    for _, record := range records {
        if record == txtRecord {
            // Mark as verified
            verification.VerifiedAt = &time.Time{}
            verification.Status = "verified"
            return ds.db.Save(verification).Error
        }
    }
    
    return fmt.Errorf("verification record not found")
}

func (ds *DomainService) AddCustomDomain(tenantID uint, domain string) error {
    // Validate domain format
    if !isValidDomain(domain) {
        return ErrInvalidDomain
    }
    
    // Check if domain already exists
    var existing DomainMapping
    if err := ds.db.Where("domain = ?", domain).First(&existing).Error; err == nil {
        return ErrDomainAlreadyExists
    }
    
    // Create domain mapping
    mapping := &DomainMapping{
        Domain:     domain,
        TenantID:   tenantID,
        Status:     "pending",
        SSLEnabled: false,
    }
    
    if err := ds.db.Create(mapping).Error; err != nil {
        return err
    }
    
    // Start verification process
    go func() {
        if err := ds.VerifyDomainOwnership(domain); err != nil {
            ds.logger.WithError(err).Error("Domain verification failed")
            mapping.Status = "failed"
            ds.db.Save(mapping)
        }
    }()
    
    return nil
}
```

### 2. SSL Certificate Management
```go
// backend/internal/services/ssl_service.go
type SSLService struct {
    certbot CertbotClient
    nginx   NginxManager
    db      *gorm.DB
}

func (ssl *SSLService) ObtainCertificate(domain string) error {
    // Run certbot
    cmd := exec.Command("certbot", "certonly",
        "--nginx",
        "--non-interactive",
        "--agree-tos",
        "--email", "admin@zplus.vn",
        "-d", domain,
        "-d", fmt.Sprintf("www.%s", domain),
    )
    
    output, err := cmd.CombinedOutput()
    if err != nil {
        return fmt.Errorf("certbot failed: %s", output)
    }
    
    // Update domain mapping
    var mapping DomainMapping
    if err := ssl.db.Where("domain = ?", domain).First(&mapping).Error; err != nil {
        return err
    }
    
    mapping.SSLEnabled = true
    mapping.Status = "active"
    
    if err := ssl.db.Save(&mapping).Error; err != nil {
        return err
    }
    
    // Generate Nginx configuration
    if err := ssl.generateNginxConfig(domain, mapping.TenantID); err != nil {
        return err
    }
    
    // Reload Nginx
    return ssl.nginx.Reload()
}

func (ssl *SSLService) generateNginxConfig(domain string, tenantID uint) error {
    template := `
server {
    listen 443 ssl http2;
    server_name {{.Domain}} www.{{.Domain}};
    
    ssl_certificate /etc/letsencrypt/live/{{.Domain}}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{{.Domain}}/privkey.pem;
    
    location /api/v1 {
        proxy_pass http://backend/api/v1;
        proxy_set_header X-Custom-Domain {{.Domain}};
        proxy_set_header X-Tenant-ID {{.TenantID}};
    }
    
    location / {
        proxy_pass http://frontend;
        proxy_set_header X-Custom-Domain {{.Domain}};
        proxy_set_header X-Tenant-ID {{.TenantID}};
    }
}
`
    
    tmpl, err := template.New("nginx").Parse(template)
    if err != nil {
        return err
    }
    
    file, err := os.Create(fmt.Sprintf("/etc/nginx/sites-available/%s", domain))
    if err != nil {
        return err
    }
    defer file.Close()
    
    data := struct {
        Domain   string
        TenantID uint
    }{
        Domain:   domain,
        TenantID: tenantID,
    }
    
    if err := tmpl.Execute(file, data); err != nil {
        return err
    }
    
    // Enable site
    symlinkPath := fmt.Sprintf("/etc/nginx/sites-enabled/%s", domain)
    return os.Symlink(
        fmt.Sprintf("/etc/nginx/sites-available/%s", domain),
        symlinkPath,
    )
}
```

## Monitoring và Troubleshooting

### 1. DNS Monitoring
```bash
#!/bin/bash
# scripts/monitor-dns.sh

DOMAINS=(
    "zplus.vn"
    "tenant1.zplus.vn"
    "tenant2.zplus.vn"
    "custom-domain.com"
)

for domain in "${DOMAINS[@]}"; do
    echo "Checking DNS for $domain..."
    
    # Check A record
    a_record=$(dig +short A $domain)
    if [ -z "$a_record" ]; then
        echo "ERROR: No A record for $domain"
    else
        echo "A record: $a_record"
    fi
    
    # Check if it resolves to our server
    if ! echo "$a_record" | grep -q "203.0.113.1"; then
        echo "WARNING: $domain does not point to our server"
    fi
    
    # Check SSL certificate
    ssl_info=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "SSL: Valid"
        echo "$ssl_info"
    else
        echo "SSL: Invalid or missing"
    fi
    
    echo "---"
done
```

### 2. SSL Certificate Monitoring
```bash
#!/bin/bash
# scripts/monitor-ssl.sh

# Check certificate expiration
certbot certificates | while read line; do
    if [[ $line =~ Certificate\ Name:\ (.+) ]]; then
        cert_name="${BASH_REMATCH[1]}"
    elif [[ $line =~ Expiry\ Date:\ (.+) ]]; then
        expiry_date="${BASH_REMATCH[1]}"
        
        # Calculate days until expiration
        expiry_timestamp=$(date -d "$expiry_date" +%s)
        current_timestamp=$(date +%s)
        days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_left -lt 30 ]; then
            echo "WARNING: Certificate $cert_name expires in $days_left days"
            # Send alert
            curl -X POST "$SLACK_WEBHOOK" -d "{\"text\":\"SSL certificate $cert_name expires in $days_left days\"}"
        fi
    fi
done
```

### 3. Common Issues และ Solutions

#### Issue: Domain not resolving
```bash
# Check DNS propagation
dig @8.8.8.8 A domain.com
dig @1.1.1.1 A domain.com

# Check NS records
dig NS domain.com

# Solution: Update DNS records hoặc wait for propagation
```

#### Issue: SSL certificate not working
```bash
# Check certificate status
certbot certificates

# Verify certificate
openssl x509 -in /etc/letsencrypt/live/domain.com/cert.pem -text -noout

# Re-obtain certificate
certbot certonly --nginx -d domain.com --force-renewal
```

#### Issue: Nginx configuration errors
```bash
# Test configuration
nginx -t

# Check logs
tail -f /var/log/nginx/error.log

# Solution: Fix configuration và reload
nginx -s reload
```

## Performance Optimization

### 1. CDN Configuration
```nginx
# Add CDN headers
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary "Accept-Encoding";
    
    # CDN-friendly headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
}
```

### 2. HTTP/2 Push
```nginx
# Push critical resources
location = / {
    http2_push /css/main.css;
    http2_push /js/main.js;
    proxy_pass http://frontend;
}
```

### 3. Compression
```nginx
# Brotli compression
load_module modules/ngx_http_brotli_filter_module.so;
load_module modules/ngx_http_brotli_static_module.so;

http {
    brotli on;
    brotli_comp_level 6;
    brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```