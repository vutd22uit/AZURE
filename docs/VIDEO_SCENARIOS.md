# 🎬 Kịch Bản Quay Video - E-commerce Cloud-Native System

Tổng hợp TẤT CẢ kịch bản có thể quay video cho demo, bảo vệ đồ án, và presentations.

## 📋 Mục Lục

1. [Videos Chính (Must-Have)](#videos-chính-must-have) - **10 videos**
2. [Videos Kỹ Thuật (Technical Deep-Dive)](#videos-kỹ-thuật-technical-deep-dive) - **8 videos**
3. [Videos Demo (Live Demos)](#videos-demo-live-demos) - **5 videos**
4. [Videos Tutorial (How-To)](#videos-tutorial-how-to) - **7 videos**
5. [Videos Tính Năng (Feature Showcase)](#videos-tính-năng-feature-showcase) - **6 videos**
6. [Videos Presentation (For Defense)](#videos-presentation-for-defense) - **4 videos**

**TỔNG CỘNG: 40 KỊCH BẢN VIDEO**

---

## Videos Chính (Must-Have)

### ✅ Video 1: System Overview (5 phút)
**Mục đích**: Giới thiệu tổng quan hệ thống

**Kịch bản**:
```
00:00 - Opening (dự án là gì)
00:30 - Architecture diagram (giải thích từng component)
02:00 - Technology stack (Azure services used)
03:00 - Key features (e-commerce + analytics + DevOps)
04:00 - Data flow (user → service → database → analytics)
04:45 - Conclusion (achievements)
```

**Screen capture**:
- README.md architecture diagram
- Azure Portal (show resources)
- Technology badges

**Script**:
```
"Hệ thống E-commerce Cloud-Native được xây dựng trên Microsoft Azure,
bao gồm 2 microservices (Auth + Order), serverless functions,
data pipeline realtime, và Power BI Embedded analytics..."
```

---

### ✅ Video 2: End-to-End User Flow (7 phút)
**Mục đích**: Demo toàn bộ flow từ user perspective

**Kịch bản**:
```
00:00 - Open application (http://localhost:3000)
00:30 - User Registration
01:30 - Login
02:00 - Browse products
03:00 - Add to cart
04:00 - Checkout & create order
05:00 - Payment processing (Azure Function)
05:30 - Email confirmation
06:00 - View order in Analytics dashboard
06:45 - Conclusion
```

**Screen capture**:
- Frontend application
- Email inbox (show confirmation)
- Power BI dashboard (show new order)

**Props needed**:
- Prepared user account
- Test credit card

---

### ✅ Video 3: Infrastructure Deployment (10 phút)
**Mục đích**: Show Terraform deployment

**Kịch bản**:
```
00:00 - Show terraform files
01:00 - terraform init
02:00 - terraform plan (show resources to be created)
04:00 - terraform apply
08:00 - Show created resources in Azure Portal
09:30 - Conclusion (12 Azure resources created)
```

**Commands**:
```bash
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

**Screen capture**:
- VS Code (terraform files)
- Terminal (terraform commands)
- Azure Portal (created resources)

---

### ✅ Video 4: Kubernetes Deployment (8 phút)
**Mục đích**: Deploy application to AKS

**Kịch bản**:
```
00:00 - Show Kubernetes manifests
01:00 - Build Docker images
03:00 - Push to ACR
04:00 - Deploy to AKS (kubectl apply)
05:00 - Check pods status
06:00 - Access application via external IP
07:30 - Conclusion
```

**Commands**:
```bash
docker build -t <acr>/auth-service:v1 ./auth-service
docker push <acr>/auth-service:v1
kubectl apply -f kubernetes/deployments/
kubectl get pods
kubectl get ingress
```

**Screen capture**:
- Terminal (build + deploy)
- Browser (access app)
- Azure Portal (AKS dashboard)

---

### ✅ Video 5: Data Pipeline Demo (15 phút)
**Mục đích**: Show complete data pipeline

**Kịch bản**:
```
00:00 - Generate demo data (seed-data-simple.js)
02:00 - Show data in Cosmos DB
03:00 - Trigger Data Factory pipeline
04:00 - Monitor pipeline execution
08:00 - Pipeline completed
09:00 - Query data in Synapse Analytics
12:00 - View data in Power BI dashboards
14:30 - Conclusion
```

**Commands**:
```bash
node scripts/seed-data-simple.js
az datafactory pipeline create-run --name CosmosToSynapsePipeline
```

**Screen capture**:
- Terminal (seed data)
- Azure Portal (Cosmos DB, Data Factory, Synapse)
- Power BI Service (dashboards)

---

### ✅ Video 6: Power BI Embedded Integration (6 phút)
**Mục đích**: Show embedded analytics

**Kịch bản**:
```
00:00 - Open Analytics page (/analytics)
00:30 - Show Overview Dashboard (KPIs, trends)
02:00 - Show Order Details Report (filters)
03:00 - Show Top Products Report
04:00 - Show Category Analysis
05:00 - Demonstrate Row-Level Security (login as different user)
05:45 - Conclusion
```

**Screen capture**:
- Frontend (/analytics page)
- Multiple user accounts (show RLS)
- Interactive filters and drill-downs

---

### ✅ Video 7: CI/CD Pipeline (12 phút)
**Mục đích**: Show automated deployment

**Kịch bản**:
```
00:00 - Show Azure DevOps pipeline
01:00 - Make code change
02:00 - Commit & push to GitHub
03:00 - Pipeline triggered automatically
04:00 - Stage 1: Build (Docker images)
06:00 - Stage 2: Test (unit + integration)
07:00 - Stage 3: Deploy Green
09:00 - Stage 4: Swap Traffic
11:00 - Verify deployment
11:45 - Conclusion
```

**Screen capture**:
- VS Code (code change)
- GitHub (commit)
- Azure DevOps (pipeline execution)
- Application (verify new version)

---

### ✅ Video 8: Performance Testing (5 phút)
**Mục đích**: Show system performance

**Kịch bản**:
```
00:00 - Show performance test script
00:30 - Run read performance test
02:00 - Show results (1,200+ req/sec)
02:30 - Run write performance test
04:00 - Show results (500+ req/sec)
04:45 - Conclusion (meets requirements)
```

**Commands**:
```bash
bash scripts/performance-tests.sh
```

**Screen capture**:
- Terminal (Apache Bench results)
- Azure Portal (metrics)

---

### ✅ Video 9: Monitoring & Logs (4 phút)
**Mục đích**: Show system monitoring

**Kịch bản**:
```
00:00 - Show Kubernetes pods (kubectl top pods)
00:30 - Show logs (kubectl logs)
01:30 - Show Application Insights (Azure Portal)
02:30 - Show metrics (CPU, Memory, Requests)
03:30 - Show alerts configuration
03:50 - Conclusion
```

**Commands**:
```bash
kubectl top pods
kubectl top nodes
kubectl logs -f deployment/order-service
```

**Screen capture**:
- Terminal (kubectl commands)
- Azure Portal (Application Insights)

---

### ✅ Video 10: Cost Analysis (3 phút)
**Mục đích**: Show cost optimization

**Kịch bản**:
```
00:00 - Show Azure Cost Management
00:30 - Breakdown by service
01:30 - Show cost optimization tips
02:00 - Pause Synapse demo
02:30 - Show estimated savings
02:50 - Conclusion
```

**Screen capture**:
- Azure Portal (Cost Management)
- README.md (cost table)

---

## Videos Kỹ Thuật (Technical Deep-Dive)

### 🔧 Video 11: Microservices Architecture (8 phút)

**Kịch bản**:
```
00:00 - Explain microservices pattern
01:00 - Auth Service deep-dive (code walkthrough)
03:00 - Order Service deep-dive
05:00 - Service-to-service communication (JWT verification)
06:30 - Database per service pattern
07:45 - Conclusion
```

---

### 🔧 Video 12: Database Design (6 phút)

**Kịch bản**:
```
00:00 - PostgreSQL schema (users table)
01:30 - Cosmos DB partitioning strategy
03:00 - Synapse star schema
05:00 - Indexing and optimization
05:45 - Conclusion
```

---

### 🔧 Video 13: Azure Functions (5 phút)

**Kịch bản**:
```
00:00 - Payment Processor function (code)
02:00 - Email Notification function (code)
03:30 - Test functions locally
04:30 - Show Azure Portal (function logs)
04:50 - Conclusion
```

---

### 🔧 Video 14: Security Implementation (7 phút)

**Kịch bản**:
```
00:00 - JWT authentication flow
01:30 - Password hashing (bcrypt)
02:30 - Kubernetes Secrets
03:30 - Azure AD integration (Power BI)
05:00 - Network security (firewall rules)
06:00 - HTTPS/TLS configuration
06:45 - Conclusion
```

---

### 🔧 Video 15: Data Factory ETL (10 phút)

**Kịch bản**:
```
00:00 - Pipeline architecture
01:00 - Cosmos DB linked service
02:00 - Copy activity configuration
04:00 - Stored procedure transformation
07:00 - Scheduling and triggers
08:30 - Error handling
09:45 - Conclusion
```

---

### 🔧 Video 16: Synapse Analytics Queries (8 phút)

**Kịch bản**:
```
00:00 - Connect to Synapse
01:00 - Query staging tables
02:00 - Query fact tables
04:00 - Query daily aggregates
05:00 - Join with dimensions
06:00 - Performance optimization
07:45 - Conclusion
```

---

### 🔧 Video 17: Terraform IaC (12 phút)

**Kịch bản**:
```
00:00 - Terraform structure
01:00 - main.tf walkthrough
04:00 - variables.tf
05:00 - outputs.tf
06:00 - State management
07:00 - Resource dependencies
09:00 - Destroy and recreate
11:45 - Conclusion
```

---

### 🔧 Video 18: Kubernetes Networking (6 phút)

**Kịch bản**:
```
00:00 - Services (ClusterIP, LoadBalancer)
02:00 - Ingress configuration
03:30 - Network policies
04:30 - Service mesh (future work)
05:45 - Conclusion
```

---

## Videos Demo (Live Demos)

### 🎪 Video 19: Continuous Orders Demo (10 phút)

**Kịch bản**:
```
00:00 - Start continuous-orders.js
00:30 - Show orders being created (real-time)
02:00 - Show Cosmos DB (orders appearing)
04:00 - Show statistics (orders/minute)
06:00 - Trigger Data Factory pipeline
07:00 - Monitor pipeline
09:00 - Show data in Synapse
09:45 - Conclusion
```

**Commands**:
```bash
node scripts/continuous-orders.js
# Let run for 5 minutes
# Trigger pipeline
# Query Synapse
```

---

### 🎪 Video 20: Quick Data Pipeline (10 phút)

**Kịch bản**: Follow `/data-pipeline/QUICK_DEMO.md`
```
00:00 - Generate data
02:00 - Trigger pipeline
03:00 - Monitor execution
08:00 - Query results
09:45 - Conclusion
```

---

### 🎪 Video 21: Full Data Pipeline (45 phút)

**Kịch bản**: Follow `/data-pipeline/DEMO_GUIDE.md`
- Complete technical walkthrough
- All stages explained
- Query examples
- BI capabilities

---

### 🎪 Video 22: Blue-Green Deployment (8 phút)

**Kịch bản**:
```
00:00 - Current blue deployment
01:00 - Deploy green version
03:00 - Test green
04:00 - Switch traffic to green
05:00 - Monitor for errors
06:30 - Verify success
07:45 - Conclusion
```

---

### 🎪 Video 23: Rollback Demo (5 phút)

**Kịch bản**:
```
00:00 - Simulate failed deployment
01:00 - Show error logs
02:00 - Trigger rollback
03:00 - Traffic back to blue
04:00 - Verify rollback success
04:45 - Conclusion
```

---

## Videos Tutorial (How-To)

### 📚 Video 24: Local Development Setup (15 phút)

**Kịch bản**:
```
00:00 - Prerequisites installation
03:00 - Clone repository
04:00 - Configure environment variables
06:00 - Start Auth Service
08:00 - Start Order Service
10:00 - Start Frontend
12:00 - Test application
14:45 - Conclusion
```

---

### 📚 Video 25: Power BI Embedded Setup (20 phút)

**Kịch bản**: Follow `/powerbi/QUICKSTART.md`
```
00:00 - Create Azure AD App
05:00 - Configure API permissions
08:00 - Create Power BI workspace
12:00 - Publish reports
15:00 - Configure Kubernetes secrets
18:00 - Test analytics page
19:45 - Conclusion
```

---

### 📚 Video 26: CI/CD Pipeline Setup (30 phút)

**Kịch bản**: Follow `/ci-cd/SETUP_GUIDE.md`
```
00:00 - Create Azure DevOps organization
03:00 - Create project
06:00 - Connect GitHub
10:00 - Configure service connections
20:00 - Setup variables
25:00 - Run first pipeline
29:45 - Conclusion
```

---

### 📚 Video 27: Seed Data Script (5 phút)

**Kịch bản**:
```
00:00 - Show seed-data-simple.js code
01:00 - Configure parameters
02:00 - Run script
03:00 - Show progress
04:00 - Verify data in Cosmos DB
04:45 - Conclusion
```

---

### 📚 Video 28: Troubleshooting Guide (10 phút)

**Kịch bản**:
```
00:00 - Common issue #1 (pods not starting)
02:00 - Common issue #2 (database connection)
04:00 - Common issue #3 (pipeline failure)
06:00 - Common issue #4 (Power BI)
08:00 - Debugging tools
09:45 - Conclusion
```

---

### 📚 Video 29: Performance Optimization (8 phút)

**Kịch bản**:
```
00:00 - Identify bottlenecks
02:00 - Database indexing
03:30 - Caching strategies
05:00 - Scale up/out
06:30 - Results comparison
07:45 - Conclusion
```

---

### 📚 Video 30: Security Best Practices (6 phút)

**Kịch bản**:
```
00:00 - Secrets management
01:30 - Network security
03:00 - Authentication & authorization
04:30 - Compliance
05:45 - Conclusion
```

---

## Videos Tính Năng (Feature Showcase)

### 🌟 Video 31: Shopping Cart Feature (4 phút)

**Kịch bản**:
```
00:00 - Add item to cart
01:00 - Update quantity
02:00 - Remove item
02:30 - Cart persistence (logout/login)
03:30 - Checkout from cart
03:50 - Conclusion
```

---

### 🌟 Video 32: Order Management (5 phút)

**Kịch bản**:
```
00:00 - Create new order
01:30 - View order history
02:30 - Track order status
03:30 - Order details
04:30 - Cancel order (if implemented)
04:50 - Conclusion
```

---

### 🌟 Video 33: Analytics Dashboard (6 phút)

**Kịch bản**:
```
00:00 - Overview dashboard (KPIs)
01:30 - Revenue trends
02:30 - Top products
03:30 - Category analysis
04:30 - Export to PDF
05:45 - Conclusion
```

---

### 🌟 Video 34: Email Notifications (3 phút)

**Kịch bản**:
```
00:00 - Create order
01:00 - Show email being sent (Azure Function logs)
01:30 - Check inbox
02:00 - Show email content
02:45 - Conclusion
```

---

### 🌟 Video 35: Search & Filter (4 phút)

**Kịch bản**:
```
00:00 - Search products by name
01:00 - Filter by category
02:00 - Filter by price range
03:00 - Sort results
03:45 - Conclusion
```

---

### 🌟 Video 36: Responsive Design (3 phút)

**Kịch bản**:
```
00:00 - Desktop view
01:00 - Tablet view
02:00 - Mobile view
02:45 - Conclusion
```

---

## Videos Presentation (For Defense)

### 🎓 Video 37: Project Introduction (5 phút)

**Kịch bản**:
```
00:00 - Problem statement
01:00 - Project objectives
02:00 - Scope and requirements
03:00 - Technology choices
04:00 - Expected outcomes
04:45 - Conclusion
```

**Slides needed**: 5-7 slides

---

### 🎓 Video 38: Architecture Presentation (10 phút)

**Kịch bản**:
```
00:00 - System overview
02:00 - Frontend architecture
04:00 - Backend architecture
06:00 - Data pipeline architecture
08:00 - Infrastructure architecture
09:45 - Conclusion
```

**Slides needed**: 10-12 slides with diagrams

---

### 🎓 Video 39: Results & Achievements (8 phút)

**Kịch bản**:
```
00:00 - Requirements checklist (all met)
02:00 - Performance benchmarks
04:00 - Cost analysis
05:00 - Grading rubric coverage (10/10)
06:00 - Challenges overcome
07:00 - Future improvements
07:45 - Conclusion
```

**Slides needed**: 8-10 slides with charts

---

### 🎓 Video 40: Q&A Preparation (15 phút)

**Kịch bản**:
```
00:00 - Q: Why Azure? (vs AWS, GCP)
02:00 - Q: Why microservices? (vs monolith)
04:00 - Q: Why Cosmos DB? (vs MongoDB)
06:00 - Q: Scalability strategy?
08:00 - Q: Security measures?
10:00 - Q: Cost optimization?
12:00 - Q: Challenges faced?
14:00 - Q: Future work?
14:45 - Conclusion
```

**Preparation**: Study technical deep-dives

---

## 📊 Video Statistics

### By Category

| Category | Videos | Total Time |
|----------|--------|------------|
| **Must-Have** | 10 | ~75 min |
| **Technical** | 8 | ~62 min |
| **Demo** | 5 | ~78 min |
| **Tutorial** | 7 | ~94 min |
| **Feature** | 6 | ~25 min |
| **Presentation** | 4 | ~38 min |
| **TOTAL** | **40** | **~372 min (6.2 hours)** |

### By Duration

| Duration | Count | Videos |
|----------|-------|--------|
| 3-5 min | 15 | Quick demos, features |
| 6-10 min | 17 | Standard demos, tutorials |
| 11-20 min | 5 | Deep-dives, setup guides |
| 20+ min | 3 | Comprehensive tutorials |

### By Priority

| Priority | Videos | Recommended For |
|----------|--------|----------------|
| **High** | 10 | Defense, must-show |
| **Medium** | 15 | Technical depth, presentations |
| **Low** | 15 | Extra credit, portfolio |

---

## 🎬 Recording Tips

### Setup

**Tools needed**:
- OBS Studio (screen recording)
- Microphone (voiceover)
- Script (teleprompter)

**Screen setup**:
```
Primary Monitor: Application/Browser
Secondary Monitor: Script/Notes
```

### Recording Checklist

Pre-recording:
- [ ] Clear desktop
- [ ] Close unnecessary apps
- [ ] Prepare test data
- [ ] Test microphone
- [ ] Read script once

During recording:
- [ ] Speak clearly and slowly
- [ ] Show each step
- [ ] Explain what you're doing
- [ ] Point out important parts

Post-recording:
- [ ] Review video
- [ ] Add captions (Vietnamese + English)
- [ ] Add intro/outro
- [ ] Export to MP4

### Video Format

**Recommended settings**:
```
Resolution: 1920x1080 (Full HD)
Frame rate: 30 fps
Bitrate: 5000 kbps
Format: MP4 (H.264)
Audio: AAC, 192 kbps
```

---

## 📝 Playlists

### Playlist 1: Quick Overview (for busy reviewers)
1. Video 1: System Overview (5 min)
2. Video 2: End-to-End User Flow (7 min)
3. Video 5: Data Pipeline Demo (15 min)
4. Video 6: Power BI Embedded (6 min)
**Total: 33 minutes**

### Playlist 2: Full Demo (for defense)
1. Video 1: System Overview
2. Video 2: End-to-End User Flow
3. Video 3: Infrastructure Deployment
4. Video 4: Kubernetes Deployment
5. Video 5: Data Pipeline Demo
6. Video 6: Power BI Embedded
7. Video 7: CI/CD Pipeline
8. Video 8: Performance Testing
9. Video 37: Project Introduction
10. Video 38: Architecture Presentation
**Total: ~80 minutes**

### Playlist 3: Technical Deep-Dive (for technical audience)
All 8 technical videos (Video 11-18)
**Total: ~62 minutes**

### Playlist 4: Tutorial Series (for learning)
All 7 tutorial videos (Video 24-30)
**Total: ~94 minutes**

---

## 🎯 Recommendations

### Must Record (Top 10)
1. ✅ Video 1: System Overview
2. ✅ Video 2: End-to-End User Flow
3. ✅ Video 5: Data Pipeline Demo
4. ✅ Video 6: Power BI Embedded
5. ✅ Video 7: CI/CD Pipeline
6. ✅ Video 19: Continuous Orders Demo
7. ✅ Video 37: Project Introduction
8. ✅ Video 38: Architecture Presentation
9. ✅ Video 39: Results & Achievements
10. ✅ Video 40: Q&A Preparation

### For Extra Credit (10 more)
11-20: Technical deep-dives + Feature showcases

### For Portfolio (All 40)
Complete video series for YouTube/LinkedIn

---

## 📅 Recording Schedule

### Week 1: Must-Have Videos (10 videos)
- Mon-Tue: Videos 1-3
- Wed-Thu: Videos 4-6
- Fri: Videos 7-8
- Weekend: Videos 9-10

### Week 2: Technical Videos (8 videos)
- Mon-Tue: Videos 11-14
- Wed-Thu: Videos 15-18

### Week 3: Demo + Tutorial (12 videos)
- Mon-Tue: Videos 19-23
- Wed-Thu: Videos 24-27
- Fri: Videos 28-30

### Week 4: Features + Presentation (10 videos)
- Mon-Tue: Videos 31-36
- Wed-Thu: Videos 37-40
- Fri: Review and editing

**Total: 4 weeks** (recording 2-3 videos per day)

---

## 💡 Pro Tips

1. **Batch recording**: Record similar videos together (same setup)
2. **Script first**: Write script before recording
3. **Test run**: Do a dry run before actual recording
4. **Backup**: Save raw footage before editing
5. **Versioning**: Keep multiple versions (director's cut, short version)
6. **Subtitles**: Add Vietnamese + English captions
7. **Branding**: Add intro/outro with your info
8. **Upload**: YouTube (unlisted) for easy sharing

---

**TỔNG KẾT: 40 KỊCH BẢN VIDEO**
**Thời lượng: ~6.2 giờ content**
**Recording time: 4 tuần (2-3 videos/day)**

**Perfect cho: Demo, Defense, Portfolio, YouTube! 🎬**
