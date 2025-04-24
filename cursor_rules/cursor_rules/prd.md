# PracticeRadar: Medical Practice Analytics Dashboard

## Product Requirements Document (PRD)

## 1. Project Overview

PracticeRadar is a comprehensive analytics dashboard designed for medical practices, specifically tailored for practices that perform procedures and bill medical aids (insurance). The dashboard offers a sleek, modern, and easy-to-use interface that provides practice managers, administrators, and doctors with actionable insights into their practice's performance.

The platform features five key modules:

1. **Practice Overview** - A high-level view of the practice's performance
2. **Financial Analysis** - Detailed financial insights and billing trends
3. **Doctor Analysis** - Individual doctor performance metrics and peer comparisons
4. **MBT Scenario Modeling** - Impact analysis of Medical Base Tariff adjustments
5. **Patient History** - Comprehensive view of individual patient records and history

### Objectives

- Provide practice administrators with actionable insights into financial performance
- Enable doctors to understand their performance relative to peers
- Allow for financial scenario planning through MBT adjustments
- Simplify patient history tracking and billing management
- Integrate AI-powered insights for performance interpretation
- Offer intuitive filtering and reporting capabilities

## 2. User Personas

### Practice Manager

- **Responsibilities**: Overall practice management, financial oversight, strategic planning
- **Goals**: Maximize practice revenue, optimize doctor utilization, ensure efficient billing cycles
- **Pain Points**: Limited visibility into financial trends, difficulty in tracking outstanding payments
- **Key Features**: Practice overview, financial analysis, MBT scenario modeling

### Doctor

- **Responsibilities**: Patient care, procedure performance, documentation
- **Goals**: Understand personal performance, improve efficiency, maximize billable time
- **Pain Points**: Lack of comparison to peers, unclear understanding of billing impact
- **Key Features**: Doctor analysis, practice overview, patient history

### Billing Administrator

- **Responsibilities**: Claims submission, payment tracking, patient billing
- **Goals**: Minimize outstanding claims, accelerate payment cycles, reduce rejections
- **Pain Points**: Manual follow-up processes, difficulty tracking payment status
- **Key Features**: Financial analysis, practice overview, patient history, outstanding claims tracking

## 3. Feature Requirements

### 3.1 Practice Overview

- **Purpose**: Provide a high-level overview of practice performance
- **Key Metrics**:
    - Total billings
    - Outstanding billings
    - Total procedures performed
- **Charts**:
    - Weekly billing trend (line graph showing total billings and outstanding billings)
    - Doctor billing by procedure type (horizontal bar graph)
    - Billing per doctor vs. procedures per doctor (bar chart with secondary axis)
    - Procedures by location (bar chart)
- **Filters**:
    - Time period (7, 30, 45, 60, 90, 180, 365 days)
    - Doctor
    - Location
    - Procedure
- **Features**:
    - AI-generated insights based on trends
    - Export functionality for billing summary data (CSV/PDF)

### 3.2 Doctor Analysis

- **Purpose**: Analyze specific doctor's performance and compare to peers
- **Key Metrics**:
    - Doctor's billings over selected period
    - Outstanding billings
    - Number of procedures performed
    - Number of unique patients served
    - Total procedure duration
- **Charts**:
    - Line graph comparing total billings (selected doctor vs. comparison group)
    - Line graph comparing procedures performed over time
    - Bar graph comparing number of days worked
- **Filters**:
    - Time period (same as overview page)
    - Doctor selection
    - Comparison doctor(s) selection (multi-select)
    - Location
- **Features**:
    - AI insights summarizing comparison and highlighting trends
    - Default comparison to average of all other doctors if no specific comparison selected

### 3.3 Financial Analysis

- **Purpose**: Provide insights into financial operations of the practice
- **Key Metrics**:
    - Revenue generated
    - Billings received
    - Billings outstanding
    - Billings paid by medical aid as percentage of total
- **Charts**:
    - Claim size distribution (bar chart)
    - Payment source distribution (pie chart)
    - Payment delay for medical aid claims (bar chart)
    - Payment delay for patient payments (bar chart)
- **Tables**:
    - Outstanding claims ordered by date (oldest to newest)
- **Filters**:
    - Time period (30, 60, 90, 180, 365 days)
- **Features**:
    - AI trend analysis comparing to previous period
    - AI chart interpretation
    - Follow-up functionality for outstanding claims

### 3.4 MBT Scenario Modeling

- **Purpose**: Model impact of adjusting Medical Base Tariff percentages on revenue
- **Key Components**:
    - List of procedures with current MBT percentages
    - Editable fields for new MBT percentages
    - Editable fields for procedure count
    - Scenario naming and saving functionality
- **Charts**:
    - Bar charts comparing revenue between scenarios (overall and per procedure)
- **Features**:
    - Scenario comparison (two scenarios at a time)
    - Scenario management (create, save, delete)
    - Revenue calculation based on formula:
    `revenuenew = (mbtnew/mbtold) * numprocedures * avgpriceperprocedure`
    - AI insights on scenario impact

### 3.5 Patient History

- **Purpose**: View comprehensive patient history and details
- **Key Components**:
    - Patient search functionality
    - Patient details display (name, gender, age, medical aid, etc.)
    - Procedure history table
- **Table Data**:
    - Date of procedure
    - Procedure description
    - Location
    - Duration
    - Cost
    - Payment status
    - Payment method
- **Features**:
    - AI-generated patient summary
    - PDF export functionality
    - Print capability

## 4. Design Elements

### 4.1 Visual Design Principles

- **Modern and Clean**: Minimalist design with ample white space
- **Consistent Layout**: Uniform layout across all pages for easy navigation
- **Responsive Design**: Fully responsive for desktop and tablet use
- **Color Palette**:
    - Primary: Blue (`#0088FE`)
    - Secondary: Green (`#00C49F`), Yellow (`#FFBB28`), Orange (`#FF8042`)
    - Neutrals: White (`#FFFFFF`), Light Gray (`#F2F2F2`), Medium Gray (`#E0E0E0`)
    - Accent: Purple (`#8884d8`)

### 4.2 UI Components

- **Navigation**: Side navigation with collapsible filter pane
- **Cards**: Rounded corners with subtle shadows for metrics and charts
- **Charts**: Clean, readable charts with consistent color schemes
- **Tables**: Striped design with hover effects
- **Filters**: Dropdown selectors with clear labeling
- **Buttons**: Clear call-to-action buttons with hover effects
- **AI Insights**: Highlighted sections with distinct styling

### 4.3 Layout Structure

- **Header**: Page title and main actions
- **Sidebar**: Collapsible filter pane
- **Main Content**:
    - Key metrics at the top (card view)
    - AI insights section
    - Charts and visual data
    - Tables (where applicable)
- **Footer**: Export/action buttons

## 5. Technical Specifications

### 5.1 Tech Stack

- **Frontend Framework**: React 18+
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **UI Component Library**: Custom components with Tailwind CSS
- **Charts**: Recharts library
- **Icons**: Lucide React
- **Data Parsing**: PapaParse for CSV handling
- **Utility Library**: Lodash
- **PDF Generation**: Browser-based printing functionality

### 5.2 Data Architecture

- **Initial Implementation**:
    - CSV file based (as specified in requirements)
    - Files: billing.csv, doctors.csv, hospitals.csv, patients.csv, procedures.csv
    - CSV parsing using PapaParse
    - In-memory data processing with Lodash
- **Future Database Integration**:
    - Relational database structure (PostgreSQL recommended)
    - Schema matching CSV structure with proper relationships
    - API endpoints for data retrieval
    - Caching strategy for frequent queries

### 5.3 Data Schema (Current CSV Structure)

- **billing.csv**:
    - Invoice / Claim ID (String)
    - Procedure Record ID (String)
    - Date Billed / Claim Submit Date (Date)
    - Billed Amount (Float)
    - Medical Aid Tariff / Expected Rate (Float)
    - MBT Percentage (Integer)
    - Amount Paid - Medical Aid (Float)
    - Date Paid - Medical Aid (Date)
    - Patient Portion / Co-payment Due (Float)
    - Amount Paid - Patient (Float)
    - Date Paid - Patient (Date)
    - Outstanding Amount (Float)
    - Rejection Code / Reason (String)
    - Write-off Amount (Float)
    - Write-off Reason (String)
    - Payment Method (String)
- **doctors.csv**:
    - Provider ID (String)
    - Provider Name (String)
    - Provider Practice Number (BHF) (Integer)
    - Specialty (String)
- **hospitals.csv**:
    - Location ID (String)
    - Location Name (String)
- **patients.csv**:
    - Patient ID (String)
    - Patient First Name (String)
    - Patient Last Name (String)
    - Patient Date of Birth (String)
    - Patient Gender (String)
    - Medical Aid Name (String)
    - Medical Aid Scheme/Plan (String)
    - Medical Aid Number (Integer)
    - Dependant Code (Integer)
- **procedures.csv**:
    - Procedure Record ID (String)
    - Provider ID (String)
    - Patient ID (String)
    - Location ID (String)
    - Date of Service (Date)
    - Procedure Code (String)
    - Procedure Description (String)
    - Diagnosis Code (ICD-10) (String)
    - Diagnosis Description (String)
    - Duration (Minutes) (Integer)
    - Time Units (Integer)
    - Modifiers (String)
    - ASA Physical Status Class (String)
    - Referring Doctor Name/Number (String)

## 6. AI Integration

### 6.1 AI Features

- **Performance Insights**:
    - Trend analysis for financial data
    - Doctor performance comparisons
    - Patient history summaries
    - MBT scenario impact assessment

### 6.2 AI Implementation

- Initially, use predefined templates with dynamic data insertion
- Future implementation could integrate with external AI services for more sophisticated analysis

## 7. Implementation Plan

### 7.1 Phase 1: Core Dashboard

- Implement basic layouts and navigation
- Integrate CSV data loading and parsing
- Build practice overview page with key metrics
- Implement basic filtering functionality

### 7.2 Phase 2: Detailed Analysis Pages

- Develop doctor analysis page with comparison features
- Build financial analysis page with charts
- Implement patient history page with search functionality

### 7.3 Phase 3: Advanced Features

- Develop MBT scenario modeling functionality
- Implement AI insight generation
- Add export and reporting capabilities
- Add print/PDF functionality

### 7.4 Phase 4: Database Integration

- Design database schema based on CSV structure
- Develop API endpoints for data retrieval
- Modify frontend to use API instead of direct CSV parsing
- Implement caching strategy for performance

## 8. Testing Strategy

### 8.1 Unit Testing

- Test individual components and functions
- Validate calculations for metrics
- Ensure proper data transformation

### 8.2 Integration Testing

- Test data flow between components
- Validate filter interactions
- Ensure chart data updates correctly

### 8.3 User Acceptance Testing

- Validate with actual users from each persona
- Ensure the dashboard provides valuable insights
- Verify ease of use and intuitive interactions

## 9. Performance Requirements

### 9.1 Data Loading

- Initial page load in under 2 seconds
- Data processing for charts in under 1 second
- Filter application response in under 500ms

### 9.2 Scalability

- Support for practices with up to 50 doctors
- Handle procedure records numbering in the hundreds of thousands
- Support concurrent users (multiple practice staff)

## 10. Future Enhancements

### 10.1 Potential Features

- Predictive revenue forecasting
- Automated billing alerts and notifications
- Integration with practice management systems
- Mobile application for on-the-go insights
- User role-based access control
- Interactive procedure scheduling

### 10.2 Technical Improvements

- Real-time data synchronization
- Advanced AI analytics integration
- Custom report builder
- Automated data backups

## Appendix: References

### Existing Components

- Practice Overview: practice_overview.tsx
- Doctor Analysis: doctor-analysis-page.tsx
- Financial Analysis: financial-analysis.tsx
- MBT Scenario Modeling: mbt-scenario-modeling.tsx
- Patient History: patient-history-page.tsx

### Data Requirements

- All data currently stored in CSV format
- Future migration path to relational database planned

## Database Schema Diagram

Below is a database schema diagram showing the relationships between the different data entities:

<artifact type="application/vnd.ant.mermaid" id="database-schema" title="PracticeRadar Database Schema">
erDiagram
    DOCTORS ||--o{ PROCEDURES : performs
    PROCEDURES ||--o{ BILLING : generates
    PATIENTS ||--o{ PROCEDURES : receives
    HOSPITALS ||--o{ PROCEDURES : hosts

```

DOCTORS {
    string ProviderID PK
    string ProviderName
    int ProviderPracticeNumber
    string Specialty
}

PROCEDURES {
    string ProcedureRecordID PK
    string ProviderID FK
    string PatientID FK
    string LocationID FK
    date DateOfService
    string ProcedureCode
    string ProcedureDescription
    string DiagnosisCode
    string DiagnosisDescription
    int DurationMinutes
    int TimeUnits
    string Modifiers
    string ASAPhysicalStatusClass
    string ReferringDoctorNameNumber
}

BILLING {
    string InvoiceClaimID PK
    string ProcedureRecordID FK
    date DateBilled
    float BilledAmount
    float MedicalAidTariff
    int MBTPercentage
    float AmountPaidMedicalAid
    date DatePaidMedicalAid
    float PatientPortion
    float AmountPaidPatient
    date DatePaidPatient
    float OutstandingAmount
    string RejectionCodeReason
    float WriteoffAmount
    string WriteoffReason
    string PaymentMethod
}

PATIENTS {
    string PatientID PK
    string PatientFirstName
    string PatientLastName
    string PatientDateOfBirth
    string PatientGender
    string MedicalAidName
    string MedicalAidSchemePlan
    int MedicalAidNumber
    int DependantCode
}

HOSPITALS {
    string LocationID PK
    string LocationName
}

```