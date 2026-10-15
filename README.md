# CyberCheck
A security health check for UK small businesses.

**Live site:** https://simon123211.github.io/cybercheck/

## What it does
Business owners answer a short questionnaire about their business, security habits, and the software they use. 
They then receive a score out of 10 with practical advice based on the NCSC Small Business Guide.
The app also searches the US National Vulnerability Database (NVD) for vulnerabilities published in the last 120 days for each product the user selects, displaying them as cards colour-coded based on severity.
The app is designed for non-technical users, works on mobile and desktop, and designed to follow WCAG accessibility guidelines. 

## Features
- Three-part form using text, email, select, range, radio, checkbox and number inputs
- Custom JavaScript validation with clear, accessible error messages
- Security score out of 10 with tailored advice for each gap
- Live vulnerability search using the NVD API, filtered by product and severity
- Colour-coded result cards with expandable descriptions
- Mobile-first responsive design with an animated mobile menu
- Accessibility: skip link, keyboard support, ARIA live regions and visible focus styles

## How to run locally
Open `index.html` in a browser, or use VS Code Live Server.

## Data and references
- NIST National Vulnerability Database API 2.0 - https://nvd.nist.gov/developers/vulnerabilities
- NCSC Small Business Guide - https://www.ncsc.gov.uk/collection/small-business-guide
- MDN Web Docs. Mozilla Developer Network - https://developer.mozilla.org/
- W3C WAI. Web Accessibility Tutorials - https://www.w3.org/WAI/tutorials/
