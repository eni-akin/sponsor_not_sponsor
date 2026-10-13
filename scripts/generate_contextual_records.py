"""Curated postings and annotations for contextual Laya training datasets."""

def build_curated_data():
    development_postings = []
    development_targets = []

    calibration_postings = []
    calibration_targets = []

    train_postings = []
    train_targets = []

    # =========================================================================
    # 1. DEVELOPMENT SPLIT (~11 postings, all blocks labeled)
    # =========================================================================

    # Dev Posting 1: WTW (Reigate UK) - 31 blocks (Software Developer Internship)
    # Authentic text from live-job-tests/wtw-202605435/request.json
    wtw_blocks_raw = [
        "With 49,000 colleagues in over 140 countries, we help organisations measure, manage and mitigate risk, explore new opportunities and unlock potential. Join us and discover a career that connects you with industry-leading expertise and global opportunities.",
        "Our ICT team combines deep consulting expertise with innovative software to help clients navigate risk and capitalise on opportunities. We design, build and deploy market-leading solutions that solve complex financial and operational challenges.",
        "Our 1,700 ICT colleagues in 35 markets share one mission – to innovate and transform insurance. To make this a reality, we deliver solutions that help our clients better select, finance and manage risk and capital. We develop software solutions that support insurance companies and other businesses that require sophisticated machine modelling and analytics processes as they confront volatile markets and regulatory changes. Our work underpins complex financial activities ranging from asset-liability modelling, pricing and reserving to economic capital aggregation and allocation.",
        "At WTW, we believe difference makes us stronger. We want our workforce to reflect the different and varied markets we operate in and to build a culture of inclusivity that makes colleagues feel welcome, valued and empowered to bring their whole selves to work every day. We are an equal opportunity employer committed to fostering an inclusive work environment throughout our organisation. We embrace all types of diversity.",
        "Joining us for eight weeks, you’ll build invaluable real-world experience at the heart of our Insurance Technology business. You’ll work with and learn from our industry-leading experts, while:",
        "Applying modern software engineering practices, techniques and tools to build, test and maintain our products and services.",
        "Writing clean, readable and tested code in Python, C# or JavaScript.",
        "Partnering with teams across the software development lifecycle to deliver value to our clients.",
        "Engaging with a global team across different locations and cultures.",
        "A continuous learning mindset with a desire to learn, grow and develop your capabilities as a software developer.",
        "Strong problem-solving and critical thinking skills.",
        "The ability to communicate complex ideas clearly and constructively, both orally and in writing.",
        "Demonstrated ability to write code in an object-oriented or functional language such as Python, C# or Java.",
        "Demonstrated understanding of core software engineering fundamentals such as data structures, algorithms and version control (e.g., Git).",
        "A bachelor's degree or equivalent in Computer Science, Software Engineering, STEM or related disciplines.",
        "Experience building personal or academic software projects.",
        "A competitive compensation package.",
        "Comprehensive health and wellness benefits covering medical and dental expenses.",
        "Company pension scheme with generous matching contributions.",
        "25 days of annual leave plus bank holidays.",
        "Flexible working arrangements supporting hybrid work.",
        "Closing Date: 15 November",
        "*** Please note that we do not accept multiple applications and you should only select and apply to one programme per year***",
        "Stage 1: Online application form and CV submission.",
        "Stage 2: An interactive digital assessment.",
        "Stage 3: A video interview assessing strengths and values.",
        "Stage 4: A virtual assessment centre, where you’ll get to meet members of the team.",
        "Stage 5: Offer and onboarding",
        "We’re committed to equal employment opportunity and provide application, interview and workplace adjustments and accommodations to all applicants. If you foresee any barriers, from the application process through to joining WTW, please email candidatehelpdesk@wtwco.com",
        "WTW is a global advisory, broking and solutions company that provides data-driven, insight-led solutions in the areas of people, risk and capital.",
        "Thank you for your interest in WTW early careers programmes."
    ]

    p1_gid = "post-dev-001:visible"
    p1_blocks = [{"id": f"wtw-{i+1:02d}", "kind": "text", "text": text, "contextGroup": p1_gid, "position": i} for i, text in enumerate(wtw_blocks_raw)]
    p1 = {
        "id": "post-dev-001", "employer": "WTW", "employerGroup": "wtw", "policyFamily": "wtw",
        "jobTitle": "2027 Software Developer Internship – Reigate", "country": "United Kingdom",
        "coverage": "complete", "split": "development", "goldHeadline": "No blocker found",
        "contextGroups": [{"id": p1_gid, "firstPosition": 0, "lastPosition": len(p1_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": p1_blocks
    }
    development_postings.append(p1)

    # WTW block annotations (all 31 targets)
    for b in p1_blocks:
        gold = {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
        tags = ["wtw-passage"]
        if b["id"] == "wtw-04":
            tags.extend(["wtw-regression", "ordinary-negative", "diversity"])
            rat = "Equal-opportunity and diversity wording does not state immigration or sponsorship policy."
        elif b["id"] == "wtw-22":
            tags.extend(["wtw-regression", "ordinary-negative", "deadline"])
            rat = "Application deadline has no immigration or eligibility policy."
        elif b["id"] == "wtw-28":
            tags.extend(["wtw-regression", "ordinary-negative", "onboarding"])
            rat = "Onboarding heading does not offer sponsorship or state eligibility policy."
        elif b["id"] in ("wtw-06", "wtw-07", "wtw-08", "wtw-09"):
            gold["scope"] = "none"
            tags.extend(["ordinary-negative", "duties"])
            rat = "Day to day developer duties have no immigration relevance."
        elif b["id"] in ("wtw-13", "wtw-14", "wtw-15"):
            gold["scope"] = "role"
            tags.extend(["ordinary-negative", "qualification"])
            rat = "Degree or programming qualification applies to the role but has no immigration relevance."
        else:
            rat = "General overview or process text with no immigration relevance."
        development_targets.append((p1, b, gold, rat, tags))

    # Dev Posting 2: Northstar Analytics (Software Engineering Intern) - No policy (headline: No blocker found)
    p2_gid = "post-dev-002:visible"
    p2_texts = [
        "Northstar Analytics is seeking a Software Engineering Intern to join our cloud data infrastructure team.",
        "You will design scalable ETL pipelines, write unit and integration tests, and collaborate with data scientists on telemetry.",
        "Proficiency in Python or Go, familiarity with SQL, and current enrollment in a Computer Science degree are required.",
        "We offer comprehensive health benefits, mentor matching, and catered lunches in our Chicago office.",
        "Applications close March 1st. Northstar is an equal opportunity employer."
    ]
    p2_blocks = [{"id": f"ns-{i+1:02d}", "kind": "text", "text": t, "contextGroup": p2_gid, "position": i} for i, t in enumerate(p2_texts)]
    p2 = {
        "id": "post-dev-002", "employer": "Northstar Analytics", "employerGroup": "northstar analytics", "policyFamily": "northstar analytics",
        "jobTitle": "Software Engineering Intern", "country": "United States", "coverage": "complete", "split": "development", "goldHeadline": "No blocker found",
        "contextGroups": [{"id": p2_gid, "firstPosition": 0, "lastPosition": len(p2_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": p2_blocks
    }
    development_postings.append(p2)
    for b in p2_blocks:
        sc = "role" if b["id"] == "ns-03" else "none"
        development_targets.append((p2, b, {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "Ordinary vacancy text without immigration content.", ["no-policy-dev"]))

    # Dev Posting 3: Harbor Robotics (Autonomous Controls Intern) - Mandatory citizenship blocker (headline: Explicit blocker found)
    p3_gid = "post-dev-003:visible"
    p3_texts = [
        "Harbor Robotics develops autonomous marine navigation systems for commercial and naval vessels.",
        "Interns will write C++ control algorithms, assist with simulation testing, and participate in dock trials.",
        "Applicants must possess strong mathematics fundamentals and working knowledge of Linux environments.",
        "U.S. citizenship is required for this position due to Department of Defense contract compliance.",
        "We provide competitive compensation, relocation stipends, and full medical coverage."
    ]
    p3_blocks = [{"id": f"hr-{i+1:02d}", "kind": "text", "text": t, "contextGroup": p3_gid, "position": i} for i, t in enumerate(p3_texts)]
    p3 = {
        "id": "post-dev-003", "employer": "Harbor Robotics", "employerGroup": "harbor robotics", "policyFamily": "harbor robotics",
        "jobTitle": "Autonomous Controls Intern", "country": "United States", "coverage": "complete", "split": "development", "goldHeadline": "Explicit blocker found",
        "contextGroups": [{"id": p3_gid, "firstPosition": 0, "lastPosition": len(p3_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": p3_blocks
    }
    development_postings.append(p3)
    for b in p3_blocks:
        if b["id"] == "hr-04":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Citizenship requirement is relevant to eligibility but leaves sponsorship unclear under DECISION_LOGIC.md."
            t = ["citizenship-blocker"]
        else:
            sc = "role" if b["id"] == "hr-03" else "none"
            g = {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Standard role qualifications or company overview."
            t = ["dev-negative"]
        development_targets.append((p3, b, g, r, t))

    # Dev Posting 4: Lakeview Systems (Product Management Intern) - Event sponsorship negative (headline: No blocker found)
    p4_gid = "post-dev-004:visible"
    p4_texts = [
        "Lakeview Systems is looking for a Summer Product Management Intern to support enterprise analytics tooling.",
        "You will gather customer feedback, define user stories, and track feature velocity across agile sprints.",
        "Candidates should be enrolled in an undergraduate business, engineering, or design curriculum.",
        "Our company proudly sponsors the annual community robotics competition and national youth hackathons.",
        "Lakeview offers hybrid flexibility, transit passes, and professional mentoring.",
        "All applicants will be considered without regard to race, religion, gender, or disability."
    ]
    p4_blocks = [{"id": f"ls-{i+1:02d}", "kind": "text", "text": t, "contextGroup": p4_gid, "position": i} for i, t in enumerate(p4_texts)]
    p4 = {
        "id": "post-dev-004", "employer": "Lakeview Systems", "employerGroup": "lakeview systems", "policyFamily": "lakeview systems",
        "jobTitle": "Product Management Intern", "country": "United States", "coverage": "complete", "split": "development", "goldHeadline": "No blocker found",
        "contextGroups": [{"id": p4_gid, "firstPosition": 0, "lastPosition": len(p4_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": p4_blocks
    }
    development_postings.append(p4)
    for b in p4_blocks:
        sc = "role" if b["id"] == "ls-03" else "none"
        development_targets.append((p4, b, {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "Event sponsorship and ordinary duties have no immigration relevance.", ["event-negative"]))

    # Dev Posting 5: Pine Labs (Data Science Intern) - Degree boundary (headline: No blocker found)
    p5_gid = "post-dev-005:visible"
    p5_texts = [
        "Pine Labs is hiring a Data Science Intern for our retail intelligence platform.",
        "You will train regression models, clean transaction datasets, and present findings to product stakeholders.",
        "Candidates must be enrolled in an accredited bachelor's or master's degree program in Statistics or CS.",
        "Familiarity with scikit-learn, Pandas, and distributed query engines such as Presto is desired.",
        "We offer weekly tech talks, competitive hourly pay, and dedicated mentorship from senior researchers."
    ]
    p5_blocks = [{"id": f"pl-{i+1:02d}", "kind": "text", "text": t, "contextGroup": p5_gid, "position": i} for i, t in enumerate(p5_texts)]
    p5 = {
        "id": "post-dev-005", "employer": "Pine Labs", "employerGroup": "pine labs", "policyFamily": "pine labs",
        "jobTitle": "Data Science Intern", "country": "United States", "coverage": "complete", "split": "development", "goldHeadline": "No blocker found",
        "contextGroups": [{"id": p5_gid, "firstPosition": 0, "lastPosition": len(p5_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": p5_blocks
    }
    development_postings.append(p5)
    for b in p5_blocks:
        sc = "role" if b["id"] in ("pl-03", "pl-04") else "none"
        development_targets.append((p5, b, {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "Academic and skill qualifications have no immigration relevance.", ["academic-boundary"]))

    # Dev Posting 6: Aspen AI (ML Research Intern) - Available sponsorship (headline: Sponsorship stated)
    p6_gid = "post-dev-006:visible"
    p6_texts = [
        "Aspen AI conducts foundational research into multi-modal transformer architectures.",
        "Interns will implement novel attention mechanisms, evaluate scaling benchmarks, and author scientific papers.",
        "Applicants should have published research or equivalent open-source contributions in generative modeling.",
        "Visa sponsorship is available for this position.",
        "We offer competitive compensation, comprehensive benefits, and computing clusters powered by H100 GPUs."
    ]
    p6_blocks = [{"id": f"aa-{i+1:02d}", "kind": "text", "text": t, "contextGroup": p6_gid, "position": i} for i, t in enumerate(p6_texts)]
    p6 = {
        "id": "post-dev-006", "employer": "Aspen AI", "employerGroup": "aspen ai", "policyFamily": "aspen ai",
        "jobTitle": "Machine Learning Research Intern", "country": "United States", "coverage": "complete", "split": "development", "goldHeadline": "Sponsorship stated",
        "contextGroups": [{"id": p6_gid, "firstPosition": 0, "lastPosition": len(p6_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": p6_blocks
    }
    development_postings.append(p6)
    for b in p6_blocks:
        if b["id"] == "aa-04":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "available", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Explicit statement that visa sponsorship is available for this role."
            t = ["dev-available"]
        else:
            sc = "role" if b["id"] == "aa-03" else "none"
            g = {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Ordinary research duties or qualification."
            t = ["dev-negative"]
        development_targets.append((p6, b, g, r, t))

    # Dev Posting 7: Aegis Aerospace (Embedded Software Intern) - ITAR export control (headline: Explicit blocker found)
    p7_gid = "post-dev-007:visible"
    p7_texts = [
        "Aegis Aerospace develops flight avionics for low-Earth orbit satellites.",
        "Interns will write embedded C/C++ firmware, debug SPI/I2C communication buses, and support environmental testing.",
        "Due to export control laws and ITAR compliance, candidates must be a U.S. Person (U.S. citizen or lawful permanent resident).",
        "Must be currently enrolled in an accredited Aerospace, Electrical, or Computer Engineering degree program.",
        "Benefits include housing stipends, wellness programs, and hands-on lab experience."
    ]
    p7_blocks = [{"id": f"ae-{i+1:02d}", "kind": "text", "text": t, "contextGroup": p7_gid, "position": i} for i, t in enumerate(p7_texts)]
    p7 = {
        "id": "post-dev-007", "employer": "Aegis Aerospace", "employerGroup": "aegis aerospace", "policyFamily": "aegis aerospace",
        "jobTitle": "Embedded Software Intern", "country": "United States", "coverage": "complete", "split": "development", "goldHeadline": "Explicit blocker found",
        "contextGroups": [{"id": p7_gid, "firstPosition": 0, "lastPosition": len(p7_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": p7_blocks
    }
    development_postings.append(p7)
    for b in p7_blocks:
        if b["id"] == "ae-03":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "ITAR U.S.-person restriction is relevant to eligibility but sponsorship remains unclear."
            t = ["export-control"]
        else:
            sc = "role" if b["id"] == "ae-04" else "none"
            g = {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Technical duties or benefits."
            t = ["dev-negative"]
        development_targets.append((p7, b, g, r, t))

    # Dev Posting 8: Copper Bank (Quantitative Analyst Intern) - Unavailable refusal (headline: Explicit blocker found)
    p8_gid = "post-dev-008:visible"
    p8_texts = [
        "Copper Bank is seeking Quantitative Analyst Interns for our electronic market making desk.",
        "You will build statistical arbitrage signals, backtest intraday alpha, and analyze tick-by-tick order books.",
        "Advanced coursework in probability, linear algebra, and high-performance C++ is required.",
        "We are unable to provide visa sponsorship now or in the future for this position.",
        "Compensation is highly competitive and includes catered breakfast and lunch."
    ]
    p8_blocks = [{"id": f"cb-{i+1:02d}", "kind": "text", "text": t, "contextGroup": p8_gid, "position": i} for i, t in enumerate(p8_texts)]
    p8 = {
        "id": "post-dev-008", "employer": "Copper Bank", "employerGroup": "copper bank", "policyFamily": "copper bank",
        "jobTitle": "Quantitative Analyst Intern", "country": "United States", "coverage": "complete", "split": "development", "goldHeadline": "Explicit blocker found",
        "contextGroups": [{"id": p8_gid, "firstPosition": 0, "lastPosition": len(p8_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": p8_blocks
    }
    development_postings.append(p8)
    for b in p8_blocks:
        if b["id"] == "cb-04":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "unavailable", "timing": "now-and-future", "cpt": "unclear", "opt": "unclear"}
            r = "Explicit refusal stating sponsorship is unavailable now or in the future."
            t = ["dev-refusal", "timing-now-and-future"]
        else:
            sc = "role" if b["id"] == "cb-03" else "none"
            g = {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Quantitative duties or requirements."
            t = ["dev-negative"]
        development_targets.append((p8, b, g, r, t))

    # Dev Posting 9: Voyager Research (Bio-Computational Intern) - Conditional sponsorship (headline: Sponsorship stated)
    p9_gid = "post-dev-009:visible"
    p9_texts = [
        "Voyager Research investigates high-throughput genomic variant calling pipelines.",
        "Interns will optimize sequence alignment algorithms and analyze whole-genome sequencing outputs.",
        "Required qualifications include proficiency in Rust or C++ and familiarity with genomics file formats.",
        "Visa sponsorship may be considered for exceptional candidates with specialized bioinformatics backgrounds.",
        "We provide comprehensive health coverage, relocation assistance, and conference travel grants."
    ]
    p9_blocks = [{"id": f"vr-{i+1:02d}", "kind": "text", "text": t, "contextGroup": p9_gid, "position": i} for i, t in enumerate(p9_texts)]
    p9 = {
        "id": "post-dev-009", "employer": "Voyager Research", "employerGroup": "voyager research", "policyFamily": "voyager research",
        "jobTitle": "Bio-Computational Intern", "country": "United States", "coverage": "complete", "split": "development", "goldHeadline": "Sponsorship stated",
        "contextGroups": [{"id": p9_gid, "firstPosition": 0, "lastPosition": len(p9_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": p9_blocks
    }
    development_postings.append(p9)
    for b in p9_blocks:
        if b["id"] == "vr-04":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "conditional", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Stated condition under which vacancy may provide sponsorship for exceptional candidates."
            t = ["dev-conditional"]
        else:
            sc = "role" if b["id"] == "vr-03" else "none"
            g = {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Genomics duties or compensation details."
            t = ["dev-negative"]
        development_targets.append((p9, b, g, r, t))

    # Dev Posting 10: Elm Networks (Cloud Infrastructure Intern) - CPT/OPT accepted, future unavailable (headline: Explicit blocker found)
    p10_gid = "post-dev-010:visible"
    p10_texts = [
        "Elm Networks manages software-defined global transit networks for enterprise customers.",
        "You will automate BGP peering sessions, build telemetry monitoring dashboards, and write Go microservices.",
        "Candidates should have strong TCP/IP networking fundamentals and familiarity with Linux kernel networking.",
        "CPT and OPT eligible candidates are welcome to apply; however, future visa sponsorship is not available.",
        "Elm Networks is an affirmative action employer offering medical, dental, and retirement benefits."
    ]
    p10_blocks = [{"id": f"en-{i+1:02d}", "kind": "text", "text": t, "contextGroup": p10_gid, "position": i} for i, t in enumerate(p10_texts)]
    p10 = {
        "id": "post-dev-010", "employer": "Elm Networks", "employerGroup": "elm networks", "policyFamily": "elm networks",
        "jobTitle": "Cloud Infrastructure Intern", "country": "United States", "coverage": "complete", "split": "development", "goldHeadline": "Explicit blocker found",
        "contextGroups": [{"id": p10_gid, "firstPosition": 0, "lastPosition": len(p10_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": p10_blocks
    }
    development_postings.append(p10)
    for b in p10_blocks:
        if b["id"] == "en-04":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "unavailable", "timing": "future", "cpt": "explicitly-accepted", "opt": "explicitly-accepted"}
            r = "CPT and OPT are explicitly accepted, but future sponsorship is explicitly unavailable."
            t = ["cpt-accepted", "opt-accepted", "future-refusal"]
        else:
            sc = "role" if b["id"] == "en-03" else "none"
            g = {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Networking infrastructure duties and requirements."
            t = ["dev-negative"]
        development_targets.append((p10, b, g, r, t))

    # Dev Posting 11: Granite Defense (Operational Challenge - Incomplete Extraction / start missing) (headline: Could not verify)
    p11_gid = "post-dev-011:visible"
    p11_texts = [
        "Maintain legacy Ada flight controls.",
        "Participate in sprint retrospectives.",
        "U.S. citizenship is required.",
        "Competitive hourly rate."
    ]
    p11_blocks = [{"id": f"gd-{i+1:02d}", "kind": "text", "text": t, "contextGroup": p11_gid, "position": i+2} for i, t in enumerate(p11_texts)]
    p11 = {
        "id": "post-dev-011", "employer": "Granite Defense", "employerGroup": "granite defense", "policyFamily": "granite defense",
        "jobTitle": "Avionics Software Intern", "country": "United States", "coverage": "incomplete", "split": "development", "goldHeadline": "Could not verify",
        "contextGroups": [{"id": p11_gid, "firstPosition": 2, "lastPosition": 5, "start": "missing", "end": "boundary"}],
        "blocks": p11_blocks
    }
    development_postings.append(p11)
    for b in p11_blocks:
        if b["id"] == "gd-03":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Citizenship requirement, but extraction is incomplete."
            t = ["challenge-missing-context"]
        else:
            g = {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Incomplete extraction challenge block."
            t = ["challenge-negative"]
        development_targets.append((p11, b, g, r, t))

    # =========================================================================
    # 2. CALIBRATION SPLIT (~11 postings, all blocks labeled)
    # =========================================================================

    # Cal Posting 1: Datadog (Software Engineer Intern) - CPT/OPT accepted (headline: No blocker found)
    c1_gid = "post-cal-001:visible"
    c1_texts = [
        "Datadog is the monitoring and security platform for cloud applications.",
        "As a Software Engineering Intern, you will work on our distributed telemetry backend handling millions of events per second.",
        "You are proficient in Go, Python, or Java and understand systems fundamentals such as threading and concurrency.",
        "We welcome applications from students eligible for CPT and OPT work authorization.",
        "Datadog provides competitive compensation, equity grants, and extensive mentorship.",
        "Equal opportunity employer committed to a diverse, inclusive workplace."
    ]
    c1_blocks = [{"id": f"dd-{i+1:02d}", "kind": "text", "text": t, "contextGroup": c1_gid, "position": i} for i, t in enumerate(c1_texts)]
    c1 = {
        "id": "post-cal-001", "employer": "Datadog", "employerGroup": "datadog", "policyFamily": "datadog",
        "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete", "split": "calibration", "goldHeadline": "No blocker found",
        "contextGroups": [{"id": c1_gid, "firstPosition": 0, "lastPosition": len(c1_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": c1_blocks
    }
    calibration_postings.append(c1)
    for b in c1_blocks:
        if b["id"] == "dd-04":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "explicitly-accepted", "opt": "explicitly-accepted"}
            r = "CPT and OPT work authorization explicitly welcomed for this role."
            t = ["cal-cpt-opt-accepted"]
        else:
            sc = "role" if b["id"] == "dd-03" else "none"
            g = {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Monitoring infrastructure duties or general text."
            t = ["cal-negative"]
        calibration_targets.append((c1, b, g, r, t))

    # Cal Posting 2: Clera (Machine Learning Intern) - No policy (headline: No blocker found)
    c2_gid = "post-cal-002:visible"
    c2_texts = [
        "Clera builds artificial intelligence tools for industrial supply chain optimization.",
        "Interns will train demand forecasting models, build evaluation benchmarks, and interface with PostgreSQL databases.",
        "Requirements: experience with PyTorch, proficiency in Python, and strong mathematical foundations.",
        "We offer comprehensive health benefits, equipment stipends, and flexible working arrangements.",
        "Clera is an equal opportunity employer."
    ]
    c2_blocks = [{"id": f"cl-{i+1:02d}", "kind": "text", "text": t, "contextGroup": c2_gid, "position": i} for i, t in enumerate(c2_texts)]
    c2 = {
        "id": "post-cal-002", "employer": "Clera", "employerGroup": "clera", "policyFamily": "clera",
        "jobTitle": "Machine Learning Intern", "country": "United States", "coverage": "complete", "split": "calibration", "goldHeadline": "No blocker found",
        "contextGroups": [{"id": c2_gid, "firstPosition": 0, "lastPosition": len(c2_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": c2_blocks
    }
    calibration_postings.append(c2)
    for b in c2_blocks:
        sc = "role" if b["id"] == "cl-03" else "none"
        calibration_targets.append((c2, b, {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "Ordinary vacancy qualifications and benefits.", ["cal-no-policy"]))

    # Cal Posting 3: Dynamic Catholic (Web Development Intern) - No policy (headline: No blocker found)
    c3_gid = "post-cal-003:visible"
    c3_texts = [
        "Dynamic Catholic creates digital media and publication resources.",
        "You will maintain WordPress websites, implement responsive UI components, and integrate Stripe checkout.",
        "Candidates should have experience with HTML5, CSS3, JavaScript, and PHP fundamentals.",
        "We provide a supportive mission-driven work environment with generous paid time off.",
        "Applications are reviewed on a rolling basis until the position is filled."
    ]
    c3_blocks = [{"id": f"dc-{i+1:02d}", "kind": "text", "text": t, "contextGroup": c3_gid, "position": i} for i, t in enumerate(c3_texts)]
    c3 = {
        "id": "post-cal-003", "employer": "Dynamic Catholic", "employerGroup": "dynamic catholic", "policyFamily": "dynamic catholic",
        "jobTitle": "Web Development Intern", "country": "United States", "coverage": "complete", "split": "calibration", "goldHeadline": "No blocker found",
        "contextGroups": [{"id": c3_gid, "firstPosition": 0, "lastPosition": len(c3_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": c3_blocks
    }
    calibration_postings.append(c3)
    for b in c3_blocks:
        sc = "role" if b["id"] == "dc-03" else "none"
        calibration_targets.append((c3, b, {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "General web development internship text.", ["cal-no-policy"]))

    # Cal Posting 4: Dean Dorton (Technology Consulting Intern) - Sponsorship unavailable (headline: Explicit blocker found)
    c4_gid = "post-cal-004:visible"
    c4_texts = [
        "Dean Dorton provides technology advisory, cybersecurity, and financial consulting services.",
        "Interns assist with ERP implementations, database migrations, and cybersecurity assessments.",
        "Applicants must be currently enrolled in an Accounting, Information Systems, or Computer Science program.",
        "Applicants must be authorized to work in the United States without current or future sponsorship.",
        "We offer competitive compensation, CPA exam assistance, and professional mentorship."
    ]
    c4_blocks = [{"id": f"ddo-{i+1:02d}", "kind": "text", "text": t, "contextGroup": c4_gid, "position": i} for i, t in enumerate(c4_texts)]
    c4 = {
        "id": "post-cal-004", "employer": "Dean Dorton", "employerGroup": "dean dorton", "policyFamily": "dean dorton",
        "jobTitle": "Technology Consulting Intern", "country": "United States", "coverage": "complete", "split": "calibration", "goldHeadline": "Explicit blocker found",
        "contextGroups": [{"id": c4_gid, "firstPosition": 0, "lastPosition": len(c4_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": c4_blocks
    }
    calibration_postings.append(c4)
    for b in c4_blocks:
        if b["id"] == "ddo-04":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "unavailable", "timing": "now-and-future", "cpt": "unclear", "opt": "unclear"}
            r = "Explicit role requirement that applicants not need current or future sponsorship."
            t = ["cal-refusal", "timing-now-and-future"]
        else:
            sc = "role" if b["id"] == "ddo-03" else "none"
            g = {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Consulting duties or qualifications."
            t = ["cal-negative"]
        calibration_targets.append((c4, b, g, r, t))

    # Cal Posting 5: Costello Medical (Health Economics & Data Science Intern) - No policy (headline: No blocker found)
    c5_gid = "post-cal-005:visible"
    c5_texts = [
        "Costello Medical delivers evidence-based medical communications and health economics consulting.",
        "You will build survival models, perform meta-analyses, and write technical reports for pharmaceutical clients.",
        "Candidates should have strong scientific literacy, familiarity with R or Python, and excellent written English.",
        "We offer a structured training curriculum, 25 days annual leave, and hybrid working options.",
        "Costello Medical is an equal opportunity employer."
    ]
    c5_blocks = [{"id": f"cm-{i+1:02d}", "kind": "text", "text": t, "contextGroup": c5_gid, "position": i} for i, t in enumerate(c5_texts)]
    c5 = {
        "id": "post-cal-005", "employer": "Costello Medical", "employerGroup": "costello medical", "policyFamily": "costello medical",
        "jobTitle": "Health Economics & Data Science Intern", "country": "United Kingdom", "coverage": "complete", "split": "calibration", "goldHeadline": "No blocker found",
        "contextGroups": [{"id": c5_gid, "firstPosition": 0, "lastPosition": len(c5_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": c5_blocks
    }
    calibration_postings.append(c5)
    for b in c5_blocks:
        sc = "role" if b["id"] == "cm-03" else "none"
        calibration_targets.append((c5, b, {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "Health economics consulting duties.", ["cal-no-policy"]))

    # Cal Posting 6: Brown University (Research Software Engineer Intern) - Available (headline: Sponsorship stated)
    c6_gid = "post-cal-006:visible"
    c6_texts = [
        "Brown University Center for Computation and Visualization supports cutting-edge academic computing.",
        "Interns will write MPI parallel code, optimize CUDA kernels, and assist faculty researchers.",
        "Qualifications: enrollment in a Computer Science or Applied Math degree and experience with C++ or Fortran.",
        "Visa sponsorship is available for eligible appointments.",
        "Brown University offers competitive student wages and access to state-of-the-art supercomputing facilities."
    ]
    c6_blocks = [{"id": f"bu-{i+1:02d}", "kind": "text", "text": t, "contextGroup": c6_gid, "position": i} for i, t in enumerate(c6_texts)]
    c6 = {
        "id": "post-cal-006", "employer": "Brown University", "employerGroup": "brown university", "policyFamily": "brown university",
        "jobTitle": "Research Software Engineer Intern", "country": "United States", "coverage": "complete", "split": "calibration", "goldHeadline": "Sponsorship stated",
        "contextGroups": [{"id": c6_gid, "firstPosition": 0, "lastPosition": len(c6_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": c6_blocks
    }
    calibration_postings.append(c6)
    for b in c6_blocks:
        if b["id"] == "bu-04":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "available", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Explicit statement that visa sponsorship is available for eligible appointments."
            t = ["cal-available"]
        else:
            sc = "role" if b["id"] == "bu-03" else "none"
            g = {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Academic supercomputing duties or benefits."
            t = ["cal-negative"]
        calibration_targets.append((c6, b, g, r, t))

    # Cal Posting 7: CesiumAstro (Space Communications Systems Intern) - ITAR restriction (headline: Explicit blocker found)
    c7_gid = "post-cal-007:visible"
    c7_texts = [
        "CesiumAstro creates active phased array communications systems for satellites and airborne platforms.",
        "You will design RF circuitry, validate phased array antenna patterns, and write automated Python test scripts.",
        "Must be a U.S. Person as defined by ITAR regulations (citizen, lawful permanent resident, asylee, or refugee).",
        "Pursuing a degree in Electrical Engineering, Computer Engineering, or Physics.",
        "We offer health insurance, 401(k) matching, and relocation assistance to Austin, Texas."
    ]
    c7_blocks = [{"id": f"ca-{i+1:02d}", "kind": "text", "text": t, "contextGroup": c7_gid, "position": i} for i, t in enumerate(c7_texts)]
    c7 = {
        "id": "post-cal-007", "employer": "CesiumAstro", "employerGroup": "cesiumastro", "policyFamily": "cesiumastro",
        "jobTitle": "Space Communications Systems Intern", "country": "United States", "coverage": "complete", "split": "calibration", "goldHeadline": "Explicit blocker found",
        "contextGroups": [{"id": c7_gid, "firstPosition": 0, "lastPosition": len(c7_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": c7_blocks
    }
    calibration_postings.append(c7)
    for b in c7_blocks:
        if b["id"] == "ca-03":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "ITAR U.S. person requirement creates eligibility restriction; sponsorship remains unclear."
            t = ["cal-itar"]
        else:
            sc = "role" if b["id"] == "ca-04" else "none"
            g = {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "RF engineering duties or benefits."
            t = ["cal-negative"]
        calibration_targets.append((c7, b, g, r, t))

    # Cal Posting 8: CaptiveAire (Controls & Embedded Software Intern) - Refusal (headline: Explicit blocker found)
    c8_gid = "post-cal-008:visible"
    c8_texts = [
        "CaptiveAire is North America's leading manufacturer of commercial kitchen ventilation equipment.",
        "Interns will develop PLC ladder logic, firmware for HVAC sensor controllers, and IoT cloud connectivity.",
        "Experience with microcontrollers (STM32, ESP32) and C programming is required.",
        "We do not sponsor employment visas.",
        "CaptiveAire provides competitive salary, medical benefits, and profit sharing bonuses."
    ]
    c8_blocks = [{"id": f"cta-{i+1:02d}", "kind": "text", "text": t, "contextGroup": c8_gid, "position": i} for i, t in enumerate(c8_texts)]
    c8 = {
        "id": "post-cal-008", "employer": "CaptiveAire", "employerGroup": "captiveaire", "policyFamily": "captiveaire",
        "jobTitle": "Controls & Embedded Software Intern", "country": "United States", "coverage": "complete", "split": "calibration", "goldHeadline": "Explicit blocker found",
        "contextGroups": [{"id": c8_gid, "firstPosition": 0, "lastPosition": len(c8_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": c8_blocks
    }
    calibration_postings.append(c8)
    for b in c8_blocks:
        if b["id"] == "cta-04":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "unavailable", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Direct role-level refusal of employment visa sponsorship."
            t = ["cal-refusal"]
        else:
            sc = "role" if b["id"] == "cta-03" else "none"
            g = {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Controls engineering duties or company background."
            t = ["cal-negative"]
        calibration_targets.append((c8, b, g, r, t))

    # Cal Posting 9: Alku (IT Application Developer Intern) - No policy (headline: No blocker found)
    c9_gid = "post-cal-009:visible"
    c9_texts = [
        "ALKU is a specialized consulting and talent advisory firm.",
        "You will design internal business dashboards using Salesforce Apex, React, and REST APIs.",
        "Applicants should be pursuing a degree in Information Technology or Computer Science.",
        "We offer comprehensive health coverage, fun team outings, and structured executive mentorship.",
        "ALKU is proud to be an equal opportunity employer."
    ]
    c9_blocks = [{"id": f"ak-{i+1:02d}", "kind": "text", "text": t, "contextGroup": c9_gid, "position": i} for i, t in enumerate(c9_texts)]
    c9 = {
        "id": "post-cal-009", "employer": "Alku", "employerGroup": "alku", "policyFamily": "alku",
        "jobTitle": "IT Application Developer Intern", "country": "United States", "coverage": "complete", "split": "calibration", "goldHeadline": "No blocker found",
        "contextGroups": [{"id": c9_gid, "firstPosition": 0, "lastPosition": len(c9_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": c9_blocks
    }
    calibration_postings.append(c9)
    for b in c9_blocks:
        sc = "role" if b["id"] == "ak-03" else "none"
        calibration_targets.append((c9, b, {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "General business application developer text.", ["cal-no-policy"]))

    # Cal Posting 10: Viget (Software Developer Intern) - No policy (headline: No blocker found)
    c10_gid = "post-cal-010:visible"
    c10_texts = [
        "Viget is a digital innovation agency that designs and builds custom web and mobile applications.",
        "Interns pair with senior engineers, contribute to client repositories, and write clean automated tests.",
        "Experience building personal software projects with Ruby on Rails, React, or Python is required.",
        "We offer a 10-week paid summer program, hardware allowances, and collaborative team culture.",
        "Viget values diversity and welcomes applicants from all educational backgrounds."
    ]
    c10_blocks = [{"id": f"vg-{i+1:02d}", "kind": "text", "text": t, "contextGroup": c10_gid, "position": i} for i, t in enumerate(c10_texts)]
    c10 = {
        "id": "post-cal-010", "employer": "Viget", "employerGroup": "viget", "policyFamily": "viget",
        "jobTitle": "Software Developer Intern", "country": "United States", "coverage": "complete", "split": "calibration", "goldHeadline": "No blocker found",
        "contextGroups": [{"id": c10_gid, "firstPosition": 0, "lastPosition": len(c10_blocks)-1, "start": "boundary", "end": "boundary"}],
        "blocks": c10_blocks
    }
    calibration_postings.append(c10)
    for b in c10_blocks:
        sc = "role" if b["id"] == "vg-03" else "none"
        calibration_targets.append((c10, b, {"relevance": "irrelevant", "scope": sc, "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "Agency developer internship duties and qualifications.", ["cal-no-policy"]))

    # Cal Posting 11: CesiumAstro Challenge (Operational Challenge - Gap in received positions) (headline: Could not verify)
    c11_gid = "post-cal-011:visible"
    c11_texts = [
        ("ca-ch-01", 0, "Develop FPGA digital signal processing blocks."),
        ("ca-ch-03", 2, "Must be a U.S. Person under ITAR regulations."),
        ("ca-ch-04", 3, "Experience with Vivado and Verilog required.")
    ]
    c11_blocks = [{"id": bid, "kind": "text", "text": t, "contextGroup": c11_gid, "position": pos} for bid, pos, t in c11_texts]
    c11 = {
        "id": "post-cal-011", "employer": "CesiumAstro Challenge", "employerGroup": "cesiumastro challenge", "policyFamily": "cesiumastro challenge",
        "jobTitle": "FPGA Engineering Intern", "country": "United States", "coverage": "incomplete", "split": "calibration", "goldHeadline": "Could not verify",
        "contextGroups": [{"id": c11_gid, "firstPosition": 0, "lastPosition": 3, "start": "boundary", "end": "boundary"}],
        "blocks": c11_blocks
    }
    calibration_postings.append(c11)
    for b in c11_blocks:
        if b["id"] == "ca-ch-03":
            g = {"relevance": "relevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "ITAR requirement with missing preceding context due to position gap."
            t = ["challenge-missing-context"]
        else:
            g = {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}
            r = "Operational challenge block beside gap."
            t = ["challenge-negative"]
        calibration_targets.append((c11, b, g, r, t))

    # =========================================================================
    # 3. TRAIN SPLIT (At least 80 reviewed targets across 4 buckets + coverage)
    # Target: 101 targets across ~25 postings, zero cross-split leakage
    # =========================================================================

    train_data_defs = [
        # Bucket 1: 40 Ordinary negatives
        # Postings with duties, benefits, diversity, deadlines, onboarding, limits, event sponsorship
        {
            "id": "post-train-001", "employer": "Affirm", "employerGroup": "affirm", "policyFamily": "affirm",
            "jobTitle": "IT Engineer Intern - Early Careers", "country": "United States", "coverage": "complete",
            "blocks": [
                ("aff-01", "Affirm is modernizing consumer credit and payment solutions for millions of shoppers.", "none", "irrelevant", ["overview"]),
                ("aff-02", "Configure macOS and Windows laptop fleets, automate identity provisioning via Okta, and troubleshoot network connectivity issues.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("aff-03", "Build internal documentation and knowledge-base guides for IT support staff.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("aff-04", "Enrolled in an undergraduate degree in Computer Science, Information Technology, or related discipline.", "role", "irrelevant", ["ordinary-negative", "qualification"]),
                ("aff-05", "Affirm provides competitive hourly pay, flexible time off, and commuter benefits.", "none", "irrelevant", ["ordinary-negative", "benefits"])
            ]
        },
        {
            "id": "post-train-002", "employer": "Coinbase", "employerGroup": "coinbase", "policyFamily": "coinbase",
            "jobTitle": "Forward Deployed Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("cb-01", "Coinbase is building the cryptoeconomy—a more fair, accessible, and transparent financial system.", "none", "irrelevant", ["overview"]),
                ("cb-02", "Develop and optimize internal workflow automations using Workato, Node.js, and GraphQL APIs.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("cb-03", "Collaborate with cross-functional stakeholders in People Operations and Security to integrate enterprise systems.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("cb-04", "We offer comprehensive medical, dental, and vision insurance coverage, 401(k) matching, and home-office equipment stipends.", "none", "irrelevant", ["ordinary-negative", "benefits"]),
                ("cb-05", "Coinbase is committed to a diverse and inclusive workplace and provides equal employment opportunity to all employees and applicants.", "none", "irrelevant", ["ordinary-negative", "diversity"])
            ]
        },
        {
            "id": "post-train-003", "employer": "DoorDash", "employerGroup": "doordash", "policyFamily": "doordash",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("dd-01", "DoorDash connects consumers with their favorite local businesses across logistics and commerce platforms.", "none", "irrelevant", ["overview"]),
                ("dd-02", "Write high-throughput backend services in Kotlin and gRPC, deploy microservices to Kubernetes, and monitor distributed tracing.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("dd-03", "Write comprehensive unit, integration, and load tests to ensure system reliability during peak order spikes.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("dd-04", "At DoorDash, our workforce reflects the diverse global communities we serve; we evaluate all qualified candidates regardless of background.", "none", "irrelevant", ["ordinary-negative", "diversity"]),
                ("dd-05", "Application Deadline: January 15th at 11:59 PM PST. Applications submitted after this time will not be reviewed.", "none", "irrelevant", ["ordinary-negative", "deadline"])
            ]
        },
        {
            "id": "post-train-004", "employer": "Workday", "employerGroup": "workday", "policyFamily": "workday",
            "jobTitle": "Software Application Development Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("wd-01", "Workday delivers enterprise cloud applications for finance, human resources, and student lifecycle management.", "none", "irrelevant", ["overview"]),
                ("wd-02", "Design intuitive web interfaces using React, TypeScript, and modern component frameworks.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("wd-03", "Interns must successfully complete a standard background check and education verification prior to their scheduled start date.", "none", "irrelevant", ["ordinary-negative", "onboarding"]),
                ("wd-04", "New hire orientation and engineering bootcamp begin on the third Monday of June.", "none", "irrelevant", ["ordinary-negative", "onboarding"]),
                ("wd-05", "Please submit only one application per recruiting year; candidates applying to multiple co-op listings will only be evaluated for their first choice.", "none", "irrelevant", ["ordinary-negative", "application-limits"])
            ]
        },
        {
            "id": "post-train-005", "employer": "Wawa", "employerGroup": "wawa", "policyFamily": "wawa",
            "jobTitle": "Information Technology Development Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("ww-01", "Wawa is a convenience retail leader with over 1,000 stores across six states and Washington D.C.", "none", "irrelevant", ["overview"]),
                ("ww-02", "Analyze retail point-of-sale data, develop automated inventory reconciliation scripts, and maintain API integrations.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("ww-03", "Candidates who previously interviewed for an intern role within the past 6 months are not eligible to re-apply this cycle.", "none", "irrelevant", ["ordinary-negative", "application-limits"]),
                ("ww-04", "Wawa proudly sponsors regional charity 5K runs and annual children's hospital fund drives.", "none", "irrelevant", ["ordinary-negative", "event-sponsorship"]),
                ("ww-05", "Wawa provides associate store discounts, paid holidays, and scholarship opportunities.", "none", "irrelevant", ["ordinary-negative", "benefits"])
            ]
        },
        {
            "id": "post-train-006", "employer": "Electronic Arts", "employerGroup": "electronic arts", "policyFamily": "electronic arts",
            "jobTitle": "Gameplay Software Engineer Co-op", "country": "Canada", "coverage": "complete",
            "blocks": [
                ("ea-01", "Electronic Arts is a global leader in digital interactive entertainment, creating beloved franchises played by millions.", "none", "irrelevant", ["overview"]),
                ("ea-02", "Implement game mechanics, physics interactions, and player animations in modern C++ within our proprietary game engine.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("ea-03", "Priority consideration will be given to candidates who submit their portfolio before the priority deadline of November 30.", "none", "irrelevant", ["ordinary-negative", "deadline"]),
                ("ea-04", "We sponsor the annual Global Game Jam and university esports championship tournaments.", "none", "irrelevant", ["ordinary-negative", "event-sponsorship"]),
                ("ea-05", "Employees enjoy access to complimentary game libraries, wellness perks, and gym memberships.", "none", "irrelevant", ["ordinary-negative", "benefits"])
            ]
        },
        {
            "id": "post-train-007", "employer": "AMD", "employerGroup": "amd", "policyFamily": "amd",
            "jobTitle": "AI Agentic Flow for GPU ASIC Design Co-op", "country": "United States", "coverage": "complete",
            "blocks": [
                ("amd-01", "AMD pushes the boundary in high-performance computing, graphics, and visualization technologies.", "none", "irrelevant", ["overview"]),
                ("amd-02", "Develop agentic LLM workflows to automate hardware verification testbench creation for next-generation GPU architectures.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("amd-03", "Applications are reviewed on a rolling basis; early submissions are strongly encouraged as roles fill quickly.", "none", "irrelevant", ["ordinary-negative", "deadline"]),
                ("amd-04", "Must be currently enrolled in an accredited BS or MS program in Electrical Engineering, Computer Engineering, or Computer Science.", "role", "irrelevant", ["ordinary-negative", "qualification"]),
                ("amd-05", "AMD promotes equal opportunity in employment and prohibits discrimination across all protected characteristics.", "none", "irrelevant", ["ordinary-negative", "diversity"])
            ]
        },
        {
            "id": "post-train-008", "employer": "Dandy", "employerGroup": "dandy", "policyFamily": "dandy",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("dan-01", "Dandy is creating the operating system for modern digital dental clinics.", "none", "irrelevant", ["overview"]),
                ("dan-02", "Build web applications using React, Go, and PostgreSQL to digitize dental lab orders and 3D scanning pipelines.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("dan-03", "Onboarding involves a two-week shadowing period with clinical specialists and an engineering mentor.", "none", "irrelevant", ["ordinary-negative", "onboarding"]),
                ("dan-04", "Dandy sponsors diversity in tech initiatives including the annual Women in Engineering Summit.", "none", "irrelevant", ["ordinary-negative", "event-sponsorship"]),
                ("dan-05", "We provide health, dental, vision coverage, flexible PTO, and lunch stipends.", "none", "irrelevant", ["ordinary-negative", "benefits"]),
                ("dan-06", "Please note that candidates may only be considered for one active application at a time.", "none", "irrelevant", ["ordinary-negative", "application-limits"])
            ]
        },
        {
            "id": "post-train-009", "employer": "Perchwell", "employerGroup": "perchwell", "policyFamily": "perchwell",
            "jobTitle": "Frontend Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("pw-01", "Perchwell is the premier real estate data and analytics platform for real estate professionals.", "none", "irrelevant", ["overview"]),
                ("pw-02", "Implement high-performance mapping interfaces, geospatial search widgets, and responsive UI in TypeScript and Next.js.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("pw-03", "Application window closes February 28th; no late materials will be accepted.", "none", "irrelevant", ["ordinary-negative", "deadline"]),
                ("pw-04", "Candidates may only submit one application per candidate profile across all open intern postings.", "none", "irrelevant", ["ordinary-negative", "application-limits"]),
                ("pw-05", "Perchwell fosters an inclusive environment committed to pay equity and non-discrimination.", "none", "irrelevant", ["ordinary-negative", "diversity"])
            ]
        },
        {
            "id": "post-train-010", "employer": "Capstone Investment Advisors", "employerGroup": "capstone investment advisors", "policyFamily": "capstone investment advisors",
            "jobTitle": "Tech Execution Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("cia-01", "Capstone is a premier global multi-strategy alternative investment management firm.", "none", "irrelevant", ["overview"]),
                ("cia-02", "Develop and monitor automated trade execution scripts and risk limits across equity derivatives.", "none", "irrelevant", ["ordinary-negative", "duties"]),
                ("cia-03", "Selected candidates must pass a background check and regulatory pre-hire compliance review.", "none", "irrelevant", ["ordinary-negative", "onboarding"]),
                ("cia-04", "Capstone is an equal opportunity employer dedicated to fair employment practices for all qualified individuals.", "none", "irrelevant", ["ordinary-negative", "diversity"]),
                ("cia-05", "We sponsor the annual MIT Trading Competition and student mathematical Olympiad events.", "none", "irrelevant", ["ordinary-negative", "event-sponsorship"])
            ]
        },

        # Bucket 2: 20 Context-sensitive targets
        # Unrelated targets beside policy (7), pronoun/reference conditions (7), adjacent conditions/exceptions (6)
        {
            "id": "post-train-011", "employer": "Palantir", "employerGroup": "palantir", "policyFamily": "palantir",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("pal-01", "Palantir builds foundational software platforms that power critical operations across governments and enterprises.", "none", "irrelevant", ["overview"]),
                ("pal-02", "Visa sponsorship is not available for this position now or in the future.", "role", "relevant", ["policy-refusal"], {"sponsorship": "unavailable", "timing": "now-and-future"}),
                ("pal-03", "This restriction applies to both full-time and intern positions across our U.S. engineering hubs.", "role", "relevant", ["context-sensitive", "pronoun-condition"], {"sponsorship": "unavailable", "timing": "now-and-future"}),
                ("pal-04", "Candidates must possess strong coding abilities in Java, Python, TypeScript, or C++.", "role", "irrelevant", ["context-sensitive", "unrelated-beside-policy"]),
                ("pal-05", "Palantir offers comprehensive medical coverage and competitive compensation packages.", "none", "irrelevant", ["benefits"])
            ]
        },
        {
            "id": "post-train-012", "employer": "Stripe", "employerGroup": "stripe", "policyFamily": "stripe",
            "jobTitle": "Software Engineering Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("str-01", "Stripe builds economic infrastructure for the internet, enabling businesses of all sizes to accept payments.", "none", "irrelevant", ["overview"]),
                ("str-02", "We provide visa sponsorship for qualified international applicants to this vacancy.", "role", "relevant", ["policy-available"], {"sponsorship": "available", "timing": "unspecified"}),
                ("str-03", "However, exceptions to this policy must be pre-approved by our global mobility and immigration counsel.", "role", "relevant", ["context-sensitive", "adjacent-condition"], {"sponsorship": "conditional", "timing": "unspecified"}),
                ("str-04", "You should have experience with distributed systems, API design, and databases.", "role", "irrelevant", ["context-sensitive", "unrelated-beside-policy"]),
                ("str-05", "The above policy applies strictly to our summer internship cohort.", "role", "relevant", ["context-sensitive", "pronoun-condition"], {"sponsorship": "unclear", "timing": "unspecified"})
            ]
        },
        {
            "id": "post-train-013", "employer": "Snowflake", "employerGroup": "snowflake", "policyFamily": "snowflake",
            "jobTitle": "Software Engineering Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("snw-01", "Snowflake delivers the Data Cloud, uniting siloed data and powering modern applications.", "none", "irrelevant", ["overview"]),
                ("snw-02", "Employment visa sponsorship will not be provided for this role.", "role", "relevant", ["policy-refusal"], {"sponsorship": "unavailable", "timing": "unspecified"}),
                ("snw-03", "This requirement cannot be waived under any circumstances.", "role", "relevant", ["context-sensitive", "pronoun-condition"], {"sponsorship": "unavailable", "timing": "unspecified"}),
                ("snw-04", "Must have completed coursework in Data Structures, Algorithms, and Operating Systems.", "role", "irrelevant", ["context-sensitive", "unrelated-beside-policy"]),
                ("snw-05", "Exceptions to the above requirement may only be granted for specific government-funded research initiatives.", "role", "relevant", ["context-sensitive", "adjacent-exception"], {"sponsorship": "conditional", "timing": "unspecified"})
            ]
        },
        {
            "id": "post-train-014", "employer": "Figma", "employerGroup": "figma", "policyFamily": "figma",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("fig-01", "Figma is the collaborative interface design platform where teams create and build software together.", "none", "irrelevant", ["overview"]),
                ("fig-02", "We do not offer visa sponsorship for this internship role.", "role", "relevant", ["policy-refusal"], {"sponsorship": "unavailable", "timing": "unspecified"}),
                ("fig-03", "Consequently, applicants must have independent permanent work authorization.", "role", "relevant", ["context-sensitive", "pronoun-condition"], {"sponsorship": "unavailable", "timing": "unspecified"}),
                ("fig-04", "Proficiency with WebGL, WebAssembly, or Rust is strongly preferred.", "role", "irrelevant", ["context-sensitive", "unrelated-beside-policy"]),
                ("fig-05", "However, candidates currently authorized under CPT are eligible to apply.", "role", "relevant", ["context-sensitive", "adjacent-exception"], {"sponsorship": "unclear", "timing": "unspecified", "cpt": "explicitly-accepted"})
            ]
        },
        {
            "id": "post-train-015", "employer": "Ramp", "employerGroup": "ramp", "policyFamily": "ramp",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("rmp-01", "Ramp is the finance automation platform designed to save businesses time and money.", "none", "irrelevant", ["overview"]),
                ("rmp-02", "Applicants must not require immigration sponsorship now or in the future.", "role", "relevant", ["policy-refusal"], {"sponsorship": "unavailable", "timing": "now-and-future"}),
                ("rmp-03", "This policy is non-negotiable for all undergraduate summer co-op openings.", "role", "relevant", ["context-sensitive", "pronoun-condition"], {"sponsorship": "unavailable", "timing": "unspecified"}),
                ("rmp-04", "Familiarity with Python, FastAPI, and React is desirable.", "role", "irrelevant", ["context-sensitive", "unrelated-beside-policy"]),
                ("rmp-05", "Unless an applicant qualifies under an approved cross-border academic exchange program, this restriction holds.", "role", "relevant", ["context-sensitive", "adjacent-exception"], {"sponsorship": "conditional", "timing": "unspecified"})
            ]
        },
        {
            "id": "post-train-016", "employer": "Robinhood", "employerGroup": "robinhood", "policyFamily": "robinhood",
            "jobTitle": "Software Engineering Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("rh-01", "Robinhood is on a mission to democratize finance for all.", "none", "irrelevant", ["overview"]),
                ("rh-02", "Visa sponsorship is available for this vacancy.", "role", "relevant", ["policy-available"], {"sponsorship": "available", "timing": "unspecified"}),
                ("rh-03", "Provided that the candidate holds active F-1 student status with school authorization.", "role", "relevant", ["context-sensitive", "adjacent-condition"], {"sponsorship": "conditional", "timing": "unspecified"}),
                ("rh-04", "Demonstrated problem-solving abilities and strong coding fundamentals in Go or Python.", "role", "irrelevant", ["context-sensitive", "unrelated-beside-policy"]),
                ("rh-05", "These provisions are subject to change based on federal immigration guidelines.", "role", "relevant", ["context-sensitive", "pronoun-condition"], {"sponsorship": "unclear", "timing": "unspecified"})
            ]
        },
        {
            "id": "post-train-017", "employer": "Verkada", "employerGroup": "verkada", "policyFamily": "verkada",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("vk-01", "Verkada builds enterprise physical security systems that protect buildings and assets globally.", "none", "irrelevant", ["overview"]),
                ("vk-02", "We cannot sponsor visas for this intern position.", "role", "relevant", ["policy-refusal"], {"sponsorship": "unavailable", "timing": "unspecified"}),
                ("vk-03", "This rule applies to all technical roles within our camera and sensor engineering teams.", "role", "relevant", ["context-sensitive", "pronoun-condition"], {"sponsorship": "unavailable", "timing": "unspecified"}),
                ("vk-04", "Working knowledge of computer vision, OpenCV, and embedded Linux.", "role", "irrelevant", ["context-sensitive", "unrelated-beside-policy"]),
                ("vk-05", "Exceptions may be made for students participating in university co-op partnerships with pre-existing work authorization.", "role", "relevant", ["context-sensitive", "adjacent-exception"], {"sponsorship": "conditional", "timing": "unspecified"})
            ]
        },

        # Bucket 3: 10 Conditional sponsorship targets (Role-level conditions under which vacancy may provide sponsorship)
        {
            "id": "post-train-018", "employer": "Duolingo", "employerGroup": "duolingo", "policyFamily": "duolingo",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("duo-01", "Duolingo is the world's most popular language-learning platform and most downloaded education app.", "none", "irrelevant", ["overview"]),
                ("duo-02", "Visa sponsorship may be considered for exceptional candidates with rare natural language processing expertise.", "role", "relevant", ["conditional-sponsorship"], {"sponsorship": "conditional", "timing": "unspecified"}),
                ("duo-03", "You will build interactive exercises, evaluate learning metrics, and improve speech recognition models.", "none", "irrelevant", ["duties"]),
                ("duo-04", "Duolingo provides free language lessons, catered lunches, and healthcare benefits.", "none", "irrelevant", ["benefits"])
            ]
        },
        {
            "id": "post-train-019", "employer": "Samsara", "employerGroup": "samsara", "policyFamily": "samsara",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("sam-01", "Samsara is the pioneer of the Connected Operations Cloud.", "none", "irrelevant", ["overview"]),
                ("sam-02", "Sponsorship is available for eligible candidates who meet the STEM degree threshold and departmental approval.", "role", "relevant", ["conditional-sponsorship"], {"sponsorship": "conditional", "timing": "unspecified"}),
                ("sam-03", "Develop IoT device management microservices using TypeScript, Go, and AWS.", "none", "irrelevant", ["duties"]),
                ("sam-04", "Competitive compensation, equity, and mentorship from industry leaders.", "none", "irrelevant", ["benefits"])
            ]
        },
        {
            "id": "post-train-010b", "employer": "Scale AI", "employerGroup": "scale ai", "policyFamily": "scale ai",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("scl-01", "Scale AI provides data infrastructure for artificial intelligence.", "none", "irrelevant", ["overview"]),
                ("scl-02", "We do not typically provide visa sponsorship; however, exceptions may be considered for PhD candidates with critical skills.", "role", "relevant", ["conditional-sponsorship"], {"sponsorship": "conditional", "timing": "unspecified"}),
                ("scl-03", "Work with frontier model labs to train evaluation agents and build automated data pipelines.", "none", "irrelevant", ["duties"]),
                ("scl-04", "Comprehensive healthcare, lunch stipends, and commuter subsidies.", "none", "irrelevant", ["benefits"])
            ]
        },
        {
            "id": "post-train-020", "employer": "Brex", "employerGroup": "brex", "policyFamily": "brex",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("brx-01", "Brex provides corporate cards, expense management, and banking solutions.", "none", "irrelevant", ["overview"]),
                ("brx-02", "Immigration sponsorship may be provided on a case-by-case basis subject to management approval.", "role", "relevant", ["conditional-sponsorship"], {"sponsorship": "conditional", "timing": "unspecified"}),
                ("brx-03", "Build financial ledgers and fraud detection pipelines in Elixir and Kotlin.", "none", "irrelevant", ["duties"]),
                ("brx-04", "Remote-first culture with annual company-wide gatherings.", "none", "irrelevant", ["benefits"])
            ]
        },
        {
            "id": "post-train-021", "employer": "Citadel", "employerGroup": "citadel", "policyFamily": "citadel",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("cit-01", "Citadel is one of the world's leading alternative investment managers.", "none", "irrelevant", ["overview"]),
                ("cit-02", "Sponsorship is available only for candidates currently residing in the United States on an active F-1 visa.", "role", "relevant", ["conditional-sponsorship"], {"sponsorship": "conditional", "timing": "unspecified"}),
                ("cit-03", "Engineer high-performance trading gateways and market data decoders in C++20.", "none", "irrelevant", ["duties"]),
                ("cit-04", "Industry-leading compensation, housing in Chicago or New York, and mentorship.", "none", "irrelevant", ["benefits"])
            ]
        },
        {
            "id": "post-train-022", "employer": "Jane Street", "employerGroup": "jane street", "policyFamily": "jane street",
            "jobTitle": "Software Development Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("js-01", "Jane Street is a quantitative trading firm powered by technology and rigorous mathematics.", "none", "irrelevant", ["overview"]),
                ("js-02", "We consider visa sponsorship for roles where specialized distributed systems experience is demonstrated.", "role", "relevant", ["conditional-sponsorship"], {"sponsorship": "conditional", "timing": "unspecified"}),
                ("js-03", "Write type-safe production software in OCaml across trading desks.", "none", "irrelevant", ["duties"]),
                ("js-04", "Competitive compensation, educational classes, and full healthcare benefits.", "none", "irrelevant", ["benefits"])
            ]
        },
        {
            "id": "post-train-023", "employer": "Papa John's", "employerGroup": "papa johns", "policyFamily": "papa johns",
            "jobTitle": "Digital Development Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("pj-01", "Papa John's delivers quality pizza and digital customer ordering experiences.", "none", "irrelevant", ["overview"]),
                ("pj-02", "Employment visa sponsorship may be offered at the discretion of the hiring department.", "role", "relevant", ["conditional-sponsorship"], {"sponsorship": "conditional", "timing": "unspecified"}),
                ("pj-03", "Support mobile app development and e-commerce cart optimization.", "none", "irrelevant", ["duties"]),
                ("pj-04", "Associate meal discounts and flexible summer scheduling.", "none", "irrelevant", ["benefits"])
            ]
        },
        {
            "id": "post-train-024", "employer": "Modernizing Medicine", "employerGroup": "modernizing medicine", "policyFamily": "modernizing medicine",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("mm-01", "ModMed transforms healthcare by delivering specialty-specific electronic health record systems.", "none", "irrelevant", ["overview"]),
                ("mm-02", "Sponsorship may be available for select positions depending on business necessity and candidate qualifications.", "role", "relevant", ["conditional-sponsorship"], {"sponsorship": "conditional", "timing": "unspecified"}),
                ("mm-03", "Build clinical charting workflows and telemedicine integrations.", "none", "irrelevant", ["duties"]),
                ("mm-04", "Health benefits, wellness programs, and Boca Raton office perks.", "none", "irrelevant", ["benefits"])
            ]
        },
        {
            "id": "post-train-025", "employer": "IDEMIA", "employerGroup": "idemia", "policyFamily": "idemia",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("idm-01", "IDEMIA provides biometric identity security and cryptographic credential solutions.", "none", "irrelevant", ["overview"]),
                ("idm-02", "We may sponsor candidates who possess rare technical skills not readily available in the local market.", "role", "relevant", ["conditional-sponsorship"], {"sponsorship": "conditional", "timing": "unspecified"}),
                ("idm-03", "Implement biometric template matching algorithms and smart card interfaces.", "none", "irrelevant", ["duties"]),
                ("idm-04", "Comprehensive benefits and access to proprietary security testbenches.", "none", "irrelevant", ["benefits"])
            ]
        },
        {
            "id": "post-train-026", "employer": "GlobalFoundries", "employerGroup": "globalfoundries", "policyFamily": "globalfoundries",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("gf-01", "GlobalFoundries is a leading semiconductor foundry manufacturing essential silicon chips.", "none", "irrelevant", ["overview"]),
                ("gf-02", "Visa sponsorship is conditional upon legal counsel review and business unit sponsorship funding.", "role", "relevant", ["conditional-sponsorship"], {"sponsorship": "conditional", "timing": "unspecified"}),
                ("gf-03", "Develop wafer fab analytics software and automated yield inspection algorithms.", "none", "irrelevant", ["duties"]),
                ("gf-04", "Competitive salary, 401(k) matching, and cleanroom training.", "none", "irrelevant", ["benefits"])
            ]
        },

        # Bucket 4: 10 Historical / other-role (5 historical past activity + 5 other-role/conversion)
        {
            "id": "post-train-027", "employer": "Elanco", "employerGroup": "elanco", "policyFamily": "elanco",
            "jobTitle": "Pet Health Sales Excellence Intern - AI Innovation", "country": "United States", "coverage": "complete",
            "blocks": [
                ("ela-01", "Elanco Animal Health delivers products and services to prevent and treat disease in pets and livestock.", "none", "irrelevant", ["overview"]),
                ("ela-02", "In past years, the firm sponsored international applicants for software roles.", "historical", "relevant", ["historical-sponsorship"], {"sponsorship": "unclear", "timing": "unspecified"}),
                ("ela-03", "Historically, our early careers program supported H-1B transfers for exceptional technical contributors.", "historical", "relevant", ["historical-sponsorship"], {"sponsorship": "unclear", "timing": "unspecified"}),
                ("ela-04", "Full-time employees hired after this internship may be eligible for visa sponsorship.", "other-role", "relevant", ["other-role-conversion"], {"sponsorship": "unclear", "timing": "unspecified"}),
                ("ela-05", "Interns who convert to regular full-time employment upon graduation may receive immigration petition support.", "other-role", "relevant", ["other-role-conversion"], {"sponsorship": "unclear", "timing": "unspecified"})
            ]
        },
        {
            "id": "post-train-028", "employer": "Peraton", "employerGroup": "peraton", "policyFamily": "peraton",
            "jobTitle": "Software Development Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("per-01", "Peraton provides mission-critical technology solutions to space, intelligence, and defense agencies.", "none", "irrelevant", ["overview"]),
                ("per-02", "Our division previously sponsored visa petitions under earlier immigration programs.", "historical", "relevant", ["historical-sponsorship"], {"sponsorship": "unclear", "timing": "unspecified"}),
                ("per-03", "Last year's intern cohort included sponsored international students under a grant pilot.", "historical", "relevant", ["historical-sponsorship"], {"sponsorship": "unclear", "timing": "unspecified"}),
                ("per-04", "Visa sponsorship is available for our London office vacancies, but not for U.S. intern postings.", "other-role", "relevant", ["other-role-policy"], {"sponsorship": "unclear", "timing": "unspecified"}),
                ("per-05", "Senior engineers hired into full-time roles may receive permanent residency sponsorship.", "other-role", "relevant", ["other-role-policy"], {"sponsorship": "unclear", "timing": "unspecified"})
            ]
        },
        {
            "id": "post-train-029", "employer": "General Motors", "employerGroup": "general motors", "policyFamily": "general motors",
            "jobTitle": "Autonomous Driving Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("gm-01", "General Motors is pioneering autonomous mobility, battery technology, and software-defined vehicles.", "none", "irrelevant", ["overview"]),
                ("gm-02", "The company historically sponsored green cards after two years of continuous service.", "historical", "relevant", ["historical-sponsorship"], {"sponsorship": "unclear", "timing": "unspecified"}),
                ("gm-03", "Candidates transitioning to regular employment upon graduation may receive immigration assistance.", "other-role", "relevant", ["other-role-conversion"], {"sponsorship": "unclear", "timing": "unspecified"}),
                ("gm-04", "Develop trajectory planning algorithms and sensor fusion modules in C++.", "none", "irrelevant", ["duties"]),
                ("gm-05", "Comprehensive automotive discounts and competitive intern wages.", "none", "irrelevant", ["benefits"])
            ]
        },

        # Additional Coverage: Applicant Questions (5), Company Scope (4), Timing Classes (6), CPT/OPT Variation (6)
        {
            "id": "post-train-030", "employer": "Jones Lang LaSalle", "employerGroup": "jones lang lasalle", "policyFamily": "jones lang lasalle",
            "jobTitle": "AI Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("jll-01", "JLL is a leading professional services firm specializing in commercial real estate and investment management.", "none", "irrelevant", ["overview"]),
                ("jll-02", "Will you now or in the future require employer visa sponsorship for work authorization?", "question", "relevant", ["applicant-question"], {"sponsorship": "unclear", "timing": "unspecified"}, "application-question"),
                ("jll-03", "Do you currently hold CPT, OPT, or other student work authorization?", "question", "relevant", ["applicant-question"], {"sponsorship": "unclear", "timing": "unspecified"}, "application-question"),
                ("jll-04", "Are you legally authorized to work in the United States?", "question", "relevant", ["applicant-question"], {"sponsorship": "unclear", "timing": "unspecified"}, "application-question"),
                ("jll-05", "Will you require an H-1B petition filing to maintain employment authorization?", "question", "relevant", ["applicant-question"], {"sponsorship": "unclear", "timing": "unspecified"}, "application-question"),
                ("jll-06", "Do you now or will you in the future require visa sponsorship to work in the U.S.?", "question", "relevant", ["applicant-question"], {"sponsorship": "unclear", "timing": "unspecified"}, "application-question")
            ]
        },
        {
            "id": "post-train-031", "employer": "7-Eleven", "employerGroup": "7-eleven", "policyFamily": "7-eleven",
            "jobTitle": "AI Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("se-01", "7-Eleven is the world's largest convenience retailer with over 80,000 stores globally.", "none", "irrelevant", ["overview"]),
                ("se-02", "As a global enterprise, our immigration team handles petitions across various international jurisdictions.", "company", "relevant", ["company-scope"], {"sponsorship": "unclear", "timing": "unspecified"}),
                ("se-03", "The company strives to support global talent across our multinational offices.", "company", "relevant", ["company-scope"], {"sponsorship": "unclear", "timing": "unspecified"}),
                ("se-04", "Our global mobility office provides relocation consultation for international assignees.", "company", "relevant", ["company-scope"], {"sponsorship": "unclear", "timing": "unspecified"}),
                ("se-05", "Corporate policy encourages international career mobility for experienced personnel.", "company", "relevant", ["company-scope"], {"sponsorship": "unclear", "timing": "unspecified"})
            ]
        },
        {
            "id": "post-train-032", "employer": "Illinois Tool Works", "employerGroup": "illinois tool works", "policyFamily": "illinois tool works",
            "jobTitle": "Software Engineer Intern - Application Software", "country": "United States", "coverage": "complete",
            "blocks": [
                ("itw-01", "ITW is a Fortune 200 global multi-industrial manufacturing leader.", "none", "irrelevant", ["overview"]),
                ("itw-02", "We can only sponsor candidates who currently hold valid work visas.", "role", "relevant", ["timing-now"], {"sponsorship": "available", "timing": "now"}),
                ("itw-03", "Applicants requiring future sponsorship for continued employment are not eligible.", "role", "relevant", ["timing-future"], {"sponsorship": "unavailable", "timing": "future"}),
                ("itw-04", "Applicants must not require sponsorship now or in the future.", "role", "relevant", ["timing-now-and-future"], {"sponsorship": "unavailable", "timing": "now-and-future"}),
                ("itw-05", "Employment visa sponsorship is available for this engineering position.", "role", "relevant", ["timing-unspecified"], {"sponsorship": "available", "timing": "unspecified"})
            ]
        },
        {
            "id": "post-train-033", "employer": "Anduril", "employerGroup": "anduril", "policyFamily": "anduril",
            "jobTitle": "Software Engineer Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("and-01", "Anduril develops defense technology hardware and software systems.", "none", "irrelevant", ["overview"]),
                ("and-02", "CPT candidates are eligible and encouraged to apply for our summer internship.", "role", "relevant", ["cpt-accepted"], {"sponsorship": "unclear", "timing": "unspecified", "cpt": "explicitly-accepted", "opt": "unclear"}),
                ("and-03", "We do not accept applicants on CPT authorization for this role.", "role", "relevant", ["cpt-excluded"], {"sponsorship": "unclear", "timing": "unspecified", "cpt": "explicitly-excluded", "opt": "unclear"}),
                ("and-04", "Candidates on STEM OPT are welcomed and supported.", "role", "relevant", ["opt-accepted"], {"sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "explicitly-accepted"}),
                ("and-05", "This position is not open to OPT or STEM OPT holders.", "role", "relevant", ["opt-excluded"], {"sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "explicitly-excluded"})
            ]
        },
        {
            "id": "post-train-034", "employer": "Robert Bosch Venture Capital", "employerGroup": "robert bosch venture capital", "policyFamily": "robert bosch venture capital",
            "jobTitle": "Business Digitalisation & AI Automation Intern", "country": "United States", "coverage": "complete",
            "blocks": [
                ("rb-01", "Bosch Ventures invests in innovative technology startups across deep tech and AI.", "none", "irrelevant", ["overview"]),
                ("rb-02", "We accept both CPT and OPT students for summer internships.", "role", "relevant", ["cpt-accepted", "opt-accepted"], {"sponsorship": "unclear", "timing": "unspecified", "cpt": "explicitly-accepted", "opt": "explicitly-accepted"}),
                ("rb-03", "We cannot accept CPT or OPT work authorization for this position.", "role", "relevant", ["cpt-excluded", "opt-excluded"], {"sponsorship": "unclear", "timing": "unspecified", "cpt": "explicitly-excluded", "opt": "explicitly-excluded"}),
                ("rb-04", "We do not provide visa sponsorship now.", "role", "relevant", ["timing-now-unavailable"], {"sponsorship": "unavailable", "timing": "now"}),
                ("rb-05", "Future sponsorship may be considered after two years of successful service.", "role", "relevant", ["timing-future-conditional"], {"sponsorship": "conditional", "timing": "future"})
            ]
        }
    ]

    for p_def in train_data_defs:
        pid = p_def["id"]
        emp = p_def["employer"]
        egrp = p_def["employerGroup"]
        pfam = p_def["policyFamily"]
        title = p_def["jobTitle"]
        country = p_def["country"]
        gid = f"{pid}:visible"
        blocks_data = []
        for i, b_tuple in enumerate(p_def["blocks"]):
            bid = b_tuple[0]
            btext = b_tuple[1]
            kind = "text"
            if len(b_tuple) > 6 and isinstance(b_tuple[6], str):
                kind = b_tuple[6]
            elif len(b_tuple) > 5 and isinstance(b_tuple[5], str):
                kind = b_tuple[5]
            blocks_data.append({"id": bid, "kind": kind, "text": btext, "contextGroup": gid, "position": i})

        posting = {
            "id": pid, "employer": emp, "employerGroup": egrp, "policyFamily": pfam,
            "jobTitle": title, "country": country, "coverage": p_def.get("coverage", "complete"), "split": "train",
            "contextGroups": [{"id": gid, "firstPosition": 0, "lastPosition": len(blocks_data)-1, "start": "boundary", "end": "boundary"}],
            "blocks": blocks_data
        }
        train_postings.append(posting)

        # Annotate targets
        for i, b_tuple in enumerate(p_def["blocks"]):
            b = blocks_data[i]
            sc = b_tuple[2]
            rel = b_tuple[3]
            tags = b_tuple[4]
            gold_overrides = {}
            if len(b_tuple) > 5 and isinstance(b_tuple[5], dict):
                gold_overrides = b_tuple[5]

            gold = {
                "relevance": rel,
                "scope": sc,
                "sponsorship": "unclear",
                "timing": "unspecified",
                "cpt": "unclear",
                "opt": "unclear"
            }
            gold.update(gold_overrides)

            # Enforce non-role invariant
            if gold["scope"] != "role":
                gold["sponsorship"] = "unclear"
                gold["timing"] = "unspecified"
                gold["cpt"] = "unclear"
                gold["opt"] = "unclear"

            # Enforce application-question
            if b["kind"] == "application-question":
                gold["scope"] = "question"
                gold["sponsorship"] = "unclear"
                gold["timing"] = "unspecified"
                gold["cpt"] = "unclear"
                gold["opt"] = "unclear"

            # Enforce irrelevant
            if gold["relevance"] == "irrelevant":
                gold["sponsorship"] = "unclear"
                gold["timing"] = "unspecified"
                gold["cpt"] = "unclear"
                gold["opt"] = "unclear"

            rat = f"Reviewed target ({', '.join(tags)}): relevance={gold['relevance']}, scope={gold['scope']}, sponsorship={gold['sponsorship']}."
            train_targets.append((posting, b, gold, rat, tags))

    return {
        "development": (development_postings, development_targets),
        "calibration": (calibration_postings, calibration_targets),
        "train": (train_postings, train_targets),
    }
