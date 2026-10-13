#!/usr/bin/env python3
"""Independently generate fresh-test dataset and postings for held-out evaluation."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def make_block(bid: str, text: str, group_id: str, pos: int, kind: str = "text") -> dict:
    return {
        "id": bid,
        "kind": kind,
        "text": text,
        "contextGroup": group_id,
        "position": pos,
    }


def make_group(gid: str, first_pos: int, last_pos: int, start: str = "boundary", end: str = "boundary") -> dict:
    return {
        "id": gid,
        "firstPosition": first_pos,
        "lastPosition": last_pos,
        "start": start,
        "end": end,
    }


def make_posting(pid: str, employer: str, employer_group: str, policy_family: str,
                 job_title: str, country: str, coverage: str, groups: list,
                 blocks: list, gold_headline: str, gold_supporting_evidence_ids: list) -> dict:
    return {
        "id": pid,
        "employer": employer,
        "employerGroup": employer_group,
        "policyFamily": policy_family,
        "jobTitle": job_title,
        "country": country,
        "coverage": coverage,
        "split": "fresh-test",
        "contextGroups": groups,
        "blocks": blocks,
        "goldHeadline": gold_headline,
        "goldSupportingEvidenceIds": gold_supporting_evidence_ids,
    }


def derive_context_for_block(posting: dict, target_block: dict) -> dict:
    group_id = target_block["contextGroup"]
    group = next((g for g in posting["contextGroups"] if g["id"] == group_id), None)
    if not group:
        raise ValueError(f"target block {target_block['id']} references undeclared group {group_id}")

    pos = target_block["position"]

    # Previous context derivation
    if pos == group["firstPosition"]:
        prev_status = group["start"]
        prev_block = None
    else:
        prev_cand = next((b for b in posting["blocks"] if b["contextGroup"] == group_id and b["position"] == pos - 1), None)
        if prev_cand is not None:
            prev_status = "present"
            prev_block = prev_cand
        else:
            prev_status = "missing"
            prev_block = None

    # Next context derivation
    if pos == group["lastPosition"]:
        next_status = group["end"]
        next_block = None
    else:
        next_cand = next((b for b in posting["blocks"] if b["contextGroup"] == group_id and b["position"] == pos + 1), None)
        if next_cand is not None:
            next_status = "present"
            next_block = next_cand
        else:
            next_status = "missing"
            next_block = None

    return {
        "previousStatus": prev_status,
        "previous": prev_block,
        "nextStatus": next_status,
        "next": next_block,
    }


def make_target_record(rid: str, posting: dict, target_block: dict, gold: dict, rationale: str, tags: list) -> dict:
    derived_ctx = derive_context_for_block(posting, target_block)
    prev_b = derived_ctx["previous"]
    next_b = derived_ctx["next"]

    ctx = {
        "previousStatus": derived_ctx["previousStatus"],
        "previous": {
            "id": prev_b["id"],
            "kind": prev_b["kind"],
            "text": prev_b["text"],
            "contextGroup": prev_b["contextGroup"],
            "position": prev_b["position"],
        } if prev_b else None,
        "nextStatus": derived_ctx["nextStatus"],
        "next": {
            "id": next_b["id"],
            "kind": next_b["kind"],
            "text": next_b["text"],
            "contextGroup": next_b["contextGroup"],
            "position": next_b["position"],
        } if next_b else None,
    }

    return {
        "id": rid,
        "postingId": posting["id"],
        "employer": posting["employer"],
        "employerGroup": posting["employerGroup"],
        "policyFamily": posting["policyFamily"],
        "jobTitle": posting["jobTitle"],
        "country": posting["country"],
        "coverage": posting["coverage"],
        "split": "fresh-test",
        "target": {
            "id": target_block["id"],
            "kind": target_block["kind"],
            "text": target_block["text"],
            "contextGroup": target_block["contextGroup"],
            "position": target_block["position"],
        },
        "context": ctx,
        "gold": gold,
        "rationale": rationale,
        "tags": tags,
        "reviewState": "assistant-reviewed",
        "reviewer": "independent-data-reviewer",
        "reviewedAt": "2026-10-10",
        "evidenceSha256": sha256_text(target_block["text"]),
    }


def build_fresh_test_data():
    postings = []
    targets = []
    rec_counter = 1

    def add_p(pid, employer, employer_group, policy_family, title, country, coverage,
              raw_blocks, gold_headline, gold_supporting_ids, annotations):
        nonlocal rec_counter
        gid = f"{pid}:main"
        blocks = []
        for idx, (kind, text, pos) in enumerate(raw_blocks):
            bid = f"{pid}-b{pos:02d}"
            blocks.append(make_block(bid, text, gid, pos, kind=kind))

        first_pos = min(b["position"] for b in blocks)
        last_pos = max(b["position"] for b in blocks)
        groups = [make_group(gid, first_pos, last_pos, start="boundary", end="boundary")]

        p = make_posting(pid, employer, employer_group, policy_family, title, country,
                         coverage, groups, blocks, gold_headline, gold_supporting_ids)
        postings.append(p)

        for b, ann in zip(blocks, annotations):
            rid = f"ft-rec-{rec_counter:04d}"
            rec_counter += 1
            rec = make_target_record(rid, p, b, ann["gold"], ann["rationale"], ann["tags"])
            targets.append(rec)

    # =========================================================================
    # 1. NO-POLICY SUBSET (10 independent postings, all gold 'No blocker found')
    # =========================================================================

    # ft-post-001: Acme Robotics
    p01_blocks = [
        ("text", "Acme Robotics develops intelligent mobile robots for automated fulfillment centers and modern industrial manufacturing facilities.", 0),
        ("text", "As a Robotics Software Engineering Intern, you will develop state estimation, perception algorithms, and ROS 2 middleware components.", 1),
        ("text", "Minimum requirements: Currently pursuing a BS or MS degree in Computer Science, Robotics, or Electrical Engineering. Proficiency in modern C++ and Python.", 2),
        ("text", "Demonstrated hands-on experience with Linux environments, Git version control, and multi-threaded programming.", 3),
        ("text", "We offer a competitive hourly wage, a relocation and housing stipend, and comprehensive 1-on-1 engineering mentorship.", 4),
        ("text", "Acme Robotics is an equal opportunity employer committed to a diverse, inclusive, and collaborative workplace environment.", 5),
    ]
    p01_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Company overview.", "tags": ["no-policy", "overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Internship core duties.", "tags": ["no-policy", "duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Degree and programming qualifications.", "tags": ["no-policy", "education"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Technical tooling qualifications.", "tags": ["no-policy", "skills"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Stipend and benefits.", "tags": ["no-policy", "benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Equal employment opportunity statement.", "tags": ["no-policy", "eeo"]},
    ]
    add_p("ft-post-001", "Acme Robotics", "acme robotics", "policy-ft-001",
          "Robotics Software Engineering Intern", "United States", "complete",
          p01_blocks, "No blocker found", [], p01_ann)

    # ft-post-002: BlueWave Dynamics
    p02_blocks = [
        ("text", "BlueWave Dynamics provides real-time oceanographic and maritime telemetry analytics for commercial navigation.", 0),
        ("text", "The Data Infrastructure Intern will design scalable streaming data pipelines using Apache Kafka, DuckDB, and Airflow.", 1),
        ("text", "Qualifications include enrollment in Computer Science, Data Science, or related engineering discipline with coursework in database internals.", 2),
        ("text", "Strong programming background in Python or Go, with understanding of distributed systems and RESTful APIs.", 3),
        ("text", "Interns participate in weekly tech talks, receive remote equipment stipends, and work directly alongside principal engineers.", 4),
        ("text", "BlueWave Dynamics values diversity of thought and provides reasonable accommodations during the interview process.", 5),
    ]
    p02_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Company summary.", "tags": ["no-policy", "overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Data engineering duties.", "tags": ["no-policy", "duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Academic qualifications.", "tags": ["no-policy", "education"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Programming qualifications.", "tags": ["no-policy", "skills"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Program perks.", "tags": ["no-policy", "benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Diversity commitment.", "tags": ["no-policy", "eeo"]},
    ]
    add_p("ft-post-002", "BlueWave Dynamics", "bluewave dynamics", "policy-ft-002",
          "Data Infrastructure Intern", "United States", "complete",
          p02_blocks, "No blocker found", [], p02_ann)

    # ft-post-003: Cedar Valley Energy
    p03_blocks = [
        ("text", "Cedar Valley Energy leads regional power transmission management and solar integration across the upper Midwest.", 0),
        ("text", "Responsibilities include building time-series predictive load models and automating substation SCADA reports.", 1),
        ("text", "Applicants should be currently registered in an undergraduate Electrical Engineering or Computer Engineering degree program.", 2),
        ("text", "Familiarity with MATLAB, Python (NumPy/Pandas), and basic electrical circuit analysis is required.", 3),
        ("text", "This is an on-site paid 12-week summer internship based out of our Des Moines engineering center.", 4),
        ("text", "Cedar Valley Energy prohibits unlawful discrimination based on race, color, religion, sex, or national origin.", 5),
    ]
    p03_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Energy company background.", "tags": ["no-policy", "overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "SCADA modeling responsibilities.", "tags": ["no-policy", "duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Degree enrollment requirement.", "tags": ["no-policy", "education"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Technical course skills.", "tags": ["no-policy", "skills"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Location and duration details.", "tags": ["no-policy", "benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Standard non-discrimination notice.", "tags": ["no-policy", "eeo"]},
    ]
    add_p("ft-post-003", "Cedar Valley Energy", "cedar valley energy", "policy-ft-003",
          "Renewable Systems Intern", "United States", "complete",
          p03_blocks, "No blocker found", [], p03_ann)

    # ft-post-004: Driftline Media
    p04_blocks = [
        ("text", "Driftline Media operates independent digital streaming platforms and interactive creator storytelling tools.", 0),
        ("text", "In this internship, you will implement accessible web UI features, optimize client bundle sizes, and write end-to-end Cypress tests.", 1),
        ("text", "You must have completed coursework in web engineering or human-computer interaction, with proficiency in TypeScript and React.", 2),
        ("text", "Experience with CSS modules, Figma design systems, and responsive layout standards is preferred.", 3),
        ("text", "Benefits include flexible hybrid working schedules, generous home-office allowances, and book learning stipends.", 4),
        ("text", "We strive to create an inclusive environment where all backgrounds are welcomed and empowered.", 5),
    ]
    p04_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Media company background.", "tags": ["no-policy", "overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Frontend web duties.", "tags": ["no-policy", "duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Frontend technical qualifications.", "tags": ["no-policy", "skills"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Preferred design tools.", "tags": ["no-policy", "skills"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Hybrid benefits.", "tags": ["no-policy", "benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Diversity statement.", "tags": ["no-policy", "eeo"]},
    ]
    add_p("ft-post-004", "Driftline Media", "driftline media", "policy-ft-004",
          "Frontend Engineering Intern", "United States", "complete",
          p04_blocks, "No blocker found", [], p04_ann)

    # ft-post-005: EchoPoint Audio
    p05_blocks = [
        ("text", "EchoPoint Audio designs high-fidelity spatial acoustics and acoustic beamforming hardware for consumer audio products.", 0),
        ("text", "The DSP Intern will prototype spatial audio filters, implement noise cancellation kernels in C++, and benchmark DSP latency.", 1),
        ("text", "Basic qualifications: Currently pursuing a Bachelor's degree or higher in Computer Science, Audio Engineering, or Applied Physics.", 2),
        ("text", "Strong foundational knowledge of linear algebra, discrete Fourier transforms, and real-time audio buffer management.", 3),
        ("text", "We provide cutting-edge hardware lab access, private headphone testing suites, and dedicated project mentors.", 4),
        ("text", "EchoPoint Audio is an equal opportunity employer and maintains a drug-free work environment.", 5),
    ]
    p05_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Company audio intro.", "tags": ["no-policy", "overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "DSP filter prototyping.", "tags": ["no-policy", "duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Degree requirement.", "tags": ["no-policy", "education"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Math and DSP skills.", "tags": ["no-policy", "skills"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Lab perks.", "tags": ["no-policy", "benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Equal opportunity statement.", "tags": ["no-policy", "eeo"]},
    ]
    add_p("ft-post-005", "EchoPoint Audio", "echopoint audio", "policy-ft-005",
          "Digital Signal Processing Intern", "United States", "complete",
          p05_blocks, "No blocker found", [], p05_ann)

    # ft-post-006: ForgeRock Analytics
    p06_blocks = [
        ("text", "ForgeRock Analytics provides enterprise identity observability and infrastructure telemetry monitoring solutions.", 0),
        ("text", "As a Platform Engineering Intern, you will configure multi-cluster Kubernetes deployments and automate Prometheus metrics.", 1),
        ("text", "Candidates must be enrolled in a university degree program in Computer Science or Software Engineering with graduation in 2027 or 2028.", 2),
        ("text", "Familiarity with containerization (Docker), shell scripting, and basic CI/CD pipeline automation using GitHub Actions.", 3),
        ("text", "Intern benefits include competitive compensation, catered lunches in our Austin office, and transit subsidies.", 4),
        ("text", "We are committed to building an environment free from discrimination and harassment.", 5),
    ]
    p06_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Company telemetry overview.", "tags": ["no-policy", "overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Infrastructure engineering tasks.", "tags": ["no-policy", "duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Degree and graduation date.", "tags": ["no-policy", "education"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "CI/CD and Docker qualifications.", "tags": ["no-policy", "skills"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Office perks.", "tags": ["no-policy", "benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Anti-harassment notice.", "tags": ["no-policy", "eeo"]},
    ]
    add_p("ft-post-006", "ForgeRock Analytics", "forgerock analytics", "policy-ft-006",
          "Platform Engineering Intern", "United States", "complete",
          p06_blocks, "No blocker found", [], p06_ann)

    # ft-post-007: Granular Health
    p07_blocks = [
        ("text", "Granular Health builds automated clinical data ingestion and genetic sequencing workflow infrastructure.", 0),
        ("text", "The Bioinformatics Software Intern will maintain Nextflow pipelines and develop QC validation scripts for genomic datasets.", 1),
        ("text", "Requirements: Enrolled in Computational Biology, Computer Science, or Biomedical Informatics.", 2),
        ("text", "Demonstrated capability with Python, Biopython, and processing variant call format (VCF) files in Unix environments.", 3),
        ("text", "Comprehensive wellness benefits, professional mentorship, and direct publication co-authorship opportunities.", 4),
        ("text", "Granular Health considers all qualified applicants without regard to age, marital status, or protected veteran status.", 5),
    ]
    p07_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Healthtech overview.", "tags": ["no-policy", "overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Genomics pipeline tasks.", "tags": ["no-policy", "duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Major requirements.", "tags": ["no-policy", "education"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Bioinformatics programming skills.", "tags": ["no-policy", "skills"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Wellness and mentorship benefits.", "tags": ["no-policy", "benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Non-discrimination clause.", "tags": ["no-policy", "eeo"]},
    ]
    add_p("ft-post-007", "Granular Health", "granular health", "policy-ft-007",
          "Bioinformatics Software Intern", "United States", "complete",
          p07_blocks, "No blocker found", [], p07_ann)

    # ft-post-008: Highland Optics
    p08_blocks = [
        ("text", "Highland Optics designs precision LiDAR and optical sensor calibration suites for autonomous robotics applications.", 0),
        ("text", "The Computer Vision Intern will train neural radiance fields (NeRF) and implement camera calibration routines in PyTorch.", 1),
        ("text", "Eligible candidates are pursuing an undergraduate or graduate degree in Computer Science, Electrical Engineering, or Mathematics.", 2),
        ("text", "Proficiency in Python, OpenCV, and 3D projective geometry fundamentals is required.", 3),
        ("text", "Position includes hands-on optical sensor bench testing and housing support for out-of-state interns.", 4),
        ("text", "We foster an open culture dedicated to technological innovation and equal professional opportunity for all team members.", 5),
    ]
    p08_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Optics sensors intro.", "tags": ["no-policy", "overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "NeRF modeling duties.", "tags": ["no-policy", "duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Degree qualifications.", "tags": ["no-policy", "education"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Vision math skills.", "tags": ["no-policy", "skills"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Housing support.", "tags": ["no-policy", "benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Equal opportunity statement.", "tags": ["no-policy", "eeo"]},
    ]
    add_p("ft-post-008", "Highland Optics", "highland optics", "policy-ft-008",
          "Computer Vision Intern", "United States", "complete",
          p08_blocks, "No blocker found", [], p08_ann)

    # ft-post-009: IronClad Logistics
    p09_blocks = [
        ("text", "IronClad Logistics engineers freight route optimization networks and predictive freight capacity matching software.", 0),
        ("text", "Operations Optimization Interns build mixed-integer linear programming formulations to minimize empty freight miles.", 1),
        ("text", "Qualifications: Current degree candidate in Operations Research, Industrial Engineering, or Computer Science.", 2),
        ("text", "Experience with mathematical solvers such as Gurobi, CPLEX, or Python SciPy optimization libraries.", 3),
        ("text", "Competitive weekly pay, remote work flexibility, and opportunities for conversion to full-time engineering roles upon graduation.", 4),
        ("text", "IronClad Logistics is dedicated to fair hiring practices and considers all applicants objectively.", 5),
    ]
    p09_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Logistics company overview.", "tags": ["no-policy", "overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Optimization mathematical duties.", "tags": ["no-policy", "duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Major qualifications.", "tags": ["no-policy", "education"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Solver programming skills.", "tags": ["no-policy", "skills"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Pay and conversion info.", "tags": ["no-policy", "benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Fair hiring statement.", "tags": ["no-policy", "eeo"]},
    ]
    add_p("ft-post-009", "IronClad Logistics", "ironclad logistics", "policy-ft-009",
          "Operations Optimization Intern", "United States", "complete",
          p09_blocks, "No blocker found", [], p09_ann)

    # ft-post-010: Jovian Network
    p10_blocks = [
        ("text", "Jovian Network provides next-generation software-defined networking fabrics and high-throughput kernel packet filtering engines.", 0),
        ("text", "Responsibilities involve developing eBPF monitoring hooks, profiling packet drops, and optimizing socket buffer allocations in C.", 1),
        ("text", "Requirements: Academic pursuit of a Bachelor of Science in Computer Engineering or Computer Science.", 2),
        ("text", "Solid understanding of TCP/IP stack layers, Linux socket programming, and memory safety principles.", 3),
        ("text", "Our intern program includes pairing with a staff engineer, attending internal tech symposiums, and a modern computing lab.", 4),
        ("text", "Jovian Network provides equal employment opportunities to all employees and applicants without regard to race or gender.", 5),
    ]
    p10_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Networking company intro.", "tags": ["no-policy", "overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "eBPF kernel duties.", "tags": ["no-policy", "duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Undergraduate degree requirement.", "tags": ["no-policy", "education"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "TCP/IP skills.", "tags": ["no-policy", "skills"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Engineering mentorship perks.", "tags": ["no-policy", "benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Equal employment statement.", "tags": ["no-policy", "eeo"]},
    ]
    add_p("ft-post-010", "Jovian Network", "jovian network", "policy-ft-010",
          "Cloud Networking Intern", "United States", "complete",
          p10_blocks, "No blocker found", [], p10_ann)

    # =========================================================================
    # 2. EXPLICIT AVAILABLE SPONSORSHIP (2 postings)
    # =========================================================================

    # ft-post-011: Kinetic ML
    p11_blocks = [
        ("text", "Kinetic ML develops large-scale multimodal foundation models and distributed tensor parallelism architectures.", 0),
        ("text", "As a Research Scientist Intern, you will conduct original research in attention mechanisms and author peer-reviewed papers.", 1),
        ("text", "Candidates should be enrolled in a PhD program in Machine Learning, Computer Science, or Computational Statistics.", 2),
        ("text", "Visa sponsorship is available for this role for eligible international students and scholars.", 3),
        ("text", "We offer competitive compensation, high-end compute cluster access, and comprehensive travel support for academic conferences.", 4),
        ("text", "Kinetic ML is an affirmative action and equal opportunity employer.", 5),
    ]
    p11_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Company intro.", "tags": ["overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Research scientist duties.", "tags": ["duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "PhD enrollment qualification.", "tags": ["education"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "available", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Explicit statement that visa sponsorship is available for this position.", "tags": ["explicit-available", "policy"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Compensation and travel.", "tags": ["benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "EEO statement.", "tags": ["eeo"]},
    ]
    add_p("ft-post-011", "Kinetic ML", "kinetic ml", "policy-ft-011",
          "Research Scientist Intern", "United States", "complete",
          p11_blocks, "Sponsorship stated", ["ft-post-011-b03"], p11_ann)

    # ft-post-012: Lattice Quantum
    p12_blocks = [
        ("text", "Lattice Quantum develops topological quantum computing simulation tools and cryogenic hardware interface drivers.", 0),
        ("text", "The Quantum Software Engineer Intern will develop Python-based pulse calibration routines for superconducting transmon qubits.", 1),
        ("text", "Qualifications include graduate studies in Quantum Information, Physics, or Computer Science with strong linear algebra skills.", 2),
        ("text", "We provide visa sponsorship, including H-1B transfer and J-1 visa processing, for all qualified candidates hired into this position.", 3),
        ("text", "Competitive stipend, laboratory housing subsidies, and relocation travel reimbursement are provided.", 4),
        ("text", "Lattice Quantum embraces diversity and provides equal opportunity across all employment stages.", 5),
    ]
    p12_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Company description.", "tags": ["overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Quantum software tasks.", "tags": ["duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Graduate academic requirements.", "tags": ["education"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "available", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Explicit provision of visa sponsorship for this position.", "tags": ["explicit-available", "policy"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Stipend and subsidies.", "tags": ["benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Equal opportunity commitment.", "tags": ["eeo"]},
    ]
    add_p("ft-post-012", "Lattice Quantum", "lattice quantum", "policy-ft-012",
          "Quantum Software Engineer Intern", "United States", "complete",
          p12_blocks, "Sponsorship stated", ["ft-post-012-b03"], p12_ann)

    # =========================================================================
    # 3. EXPLICIT UNAVAILABLE SPONSORSHIP (3 postings)
    # =========================================================================

    # ft-post-013: Monarch Payment Solutions
    p13_blocks = [
        ("text", "Monarch Payment Solutions processes secure high-volume merchant transactions and fraud detection across North America.", 0),
        ("text", "Software Engineer Interns will write robust microservices in Java/Spring Boot and optimize relational database queries.", 1),
        ("text", "Requirements: Enrolled in an undergraduate Computer Science degree program with completed data structures coursework.", 2),
        ("text", "Applicants must not require sponsorship now or in the future to be considered for this internship.", 3),
        ("text", "Competitive hourly pay, hybrid office setup in Charlotte, and comprehensive healthcare coverage.", 4),
        ("text", "Monarch Payment Solutions is proud to be an equal opportunity employer.", 5),
    ]
    p13_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Fintech overview.", "tags": ["overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Java microservices responsibilities.", "tags": ["duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Undergraduate degree requirement.", "tags": ["education"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "unavailable", "timing": "now-and-future", "cpt": "unclear", "opt": "unclear"}, "rationale": "Explicit refusal stating applicants must not require sponsorship now or in the future.", "tags": ["explicit-refusal", "now-and-future"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Benefits package.", "tags": ["benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Equal opportunity statement.", "tags": ["eeo"]},
    ]
    add_p("ft-post-013", "Monarch Payment Solutions", "monarch payment solutions", "policy-ft-013",
          "Software Engineer Intern", "United States", "complete",
          p13_blocks, "Explicit blocker found", ["ft-post-013-b03"], p13_ann)

    # ft-post-014: Nexus BioSystems (includes application question)
    p14_blocks = [
        ("text", "Nexus BioSystems designs precision microfluidic instruments and diagnostic embedded controllers for point-of-care testing.", 0),
        ("text", "The Embedded Firmware Intern will write bare-metal C code for ARM Cortex-M microcontrollers and interface with SPI sensors.", 1),
        ("text", "Applicants should be pursuing an Electrical Engineering or Computer Engineering degree with embedded systems lab experience.", 2),
        ("text", "Visa sponsorship is not available for this role. Candidates must possess current and ongoing work authorization without company support.", 3),
        ("application-question", "Will you now or in the future require company sponsorship for an employment visa or work permit?", 4),
        ("text", "Comprehensive wellness stipend, flexible paid time off, and mentorship from senior embedded engineers.", 5),
    ]
    p14_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Biotech instruments background.", "tags": ["overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "ARM microcontroller tasks.", "tags": ["duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Degree requirement.", "tags": ["education"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "unavailable", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Explicit statement that visa sponsorship is not available.", "tags": ["explicit-refusal", "unspecified-timing"]},
        {"gold": {"relevance": "relevant", "scope": "question", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Applicant questionnaire item regarding sponsorship; questions cannot establish employer policy.", "tags": ["applicant-question"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Benefits and mentorship.", "tags": ["benefits"]},
    ]
    add_p("ft-post-014", "Nexus BioSystems", "nexus biosystems", "policy-ft-014",
          "Embedded Firmware Intern", "United States", "complete",
          p14_blocks, "Explicit blocker found", ["ft-post-014-b03"], p14_ann)

    # ft-post-015: Oasis Commerce
    p15_blocks = [
        ("text", "Oasis Commerce operates headless e-commerce APIs and real-time inventory synchronization systems.", 0),
        ("text", "As a Full Stack Developer Intern, you will build customer dashboard features using TypeScript, Node.js, and GraphQL.", 1),
        ("text", "Applicants must be enrolled in a college or university degree program in Computer Science or a related technical discipline.", 2),
        ("text", "We are unable to offer visa sponsorship for this position at this time.", 3),
        ("text", "Interns receive competitive pay, a home office technology budget, and weekly pair programming sessions.", 4),
        ("text", "Oasis Commerce provides equal employment opportunities to all candidates regardless of race, gender, or religion.", 5),
    ]
    p15_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "E-commerce platform overview.", "tags": ["overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Full stack development duties.", "tags": ["duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "College enrollment requirement.", "tags": ["education"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "unavailable", "timing": "now", "cpt": "unclear", "opt": "unclear"}, "rationale": "Explicit statement refusing sponsorship at this time.", "tags": ["explicit-refusal", "now-timing"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Stipend and pair programming.", "tags": ["benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "EEO statement.", "tags": ["eeo"]},
    ]
    add_p("ft-post-015", "Oasis Commerce", "oasis commerce", "policy-ft-015",
          "Full Stack Developer Intern", "United States", "complete",
          p15_blocks, "Explicit blocker found", ["ft-post-015-b03"], p15_ann)

    # =========================================================================
    # 4. EXPLICIT CONDITIONAL SPONSORSHIP (2 postings)
    # =========================================================================

    # ft-post-016: Prism AI Labs (includes company/other-role scope block)
    p16_blocks = [
        ("text", "Prism AI Labs conducts advanced research in generative foundation models, reinforcement learning, and autonomous agents.", 0),
        ("text", "The AI Research Intern will conduct empirical experiments, train transformer models, and evaluate scaling law benchmarks.", 1),
        ("text", "Candidates must be enrolled in an MS or PhD program in Computer Science or Artificial Intelligence.", 2),
        ("text", "Visa sponsorship may be considered on a case-by-case basis for exceptional candidates with verified first-author publications at tier-1 AI conferences.", 3),
        ("text", "Our global enterprise policy allows full-time employees in qualifying engineering ladders to seek permanent residency sponsorship after two years of service.", 4),
        ("text", "Prism AI Labs is committed to fostering an inclusive and innovative workplace for all researchers.", 5),
    ]
    p16_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "AI lab overview.", "tags": ["overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Model training duties.", "tags": ["duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Graduate degree requirement.", "tags": ["education"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "conditional", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Conditional sponsorship stated for exceptional candidates with tier-1 publications.", "tags": ["conditional-sponsorship"]},
        {"gold": {"relevance": "relevant", "scope": "other-role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "General full-time employee green card policy; other-role scope cannot establish policy for this internship.", "tags": ["other-role"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "EEO commitment.", "tags": ["eeo"]},
    ]
    add_p("ft-post-016", "Prism AI Labs", "prism ai labs", "policy-ft-016",
          "AI Research Intern", "United States", "complete",
          p16_blocks, "Sponsorship stated", ["ft-post-016-b03"], p16_ann)

    # ft-post-017: Quantix Trading
    p17_blocks = [
        ("text", "Quantix Trading deploys quantitative algorithmic trading strategies across global equities and derivatives exchanges.", 0),
        ("text", "The Quantitative Research Intern will formulate statistical alpha signals, backtest factor models, and analyze order book dynamics.", 1),
        ("text", "Applicants should be pursuing an advanced degree in Mathematics, Statistics, Quantitative Finance, or Physics.", 2),
        ("text", "We do not ordinarily sponsor work visas; however, an exception may be approved if authorized by the executive committee and immigration counsel.", 3),
        ("text", "Highly competitive trading intern salary, performance completion bonuses, and luxury corporate housing in New York City.", 4),
        ("text", "Quantix Trading maintains an objective merit-based hiring policy open to all qualified applicants.", 5),
    ]
    p17_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Trading firm overview.", "tags": ["overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Alpha modeling duties.", "tags": ["duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Quantitative academic requirement.", "tags": ["education"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "conditional", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Conditional provision upon executive committee and immigration counsel approval.", "tags": ["conditional-sponsorship"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Compensation and housing.", "tags": ["benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Hiring policy.", "tags": ["eeo"]},
    ]
    add_p("ft-post-017", "Quantix Trading", "quantix trading", "policy-ft-017",
          "Quantitative Research Intern", "United States", "complete",
          p17_blocks, "Sponsorship stated", ["ft-post-017-b03"], p17_ann)

    # =========================================================================
    # 5. CPT AND OPT ACCEPTANCE (2 postings)
    # =========================================================================

    # ft-post-018: Riptide Security
    p18_blocks = [
        ("text", "Riptide Security builds automated cloud security posture management and runtime vulnerability detection software.", 0),
        ("text", "Security Engineering Interns will analyze container security profiles, audit IAM policies, and automate vulnerability alerts in Go.", 1),
        ("text", "Candidates must be enrolled in an undergraduate or graduate degree program in Cybersecurity, Computer Science, or Information Systems.", 2),
        ("text", "CPT and OPT candidates are welcome to apply; however, long-term employment visa sponsorship will not be provided for this role.", 3),
        ("text", "Paid 10-week summer internship, home office hardware package, and continuous mentorship from senior security researchers.", 4),
        ("text", "Riptide Security is an equal opportunity employer committed to a diverse workforce.", 5),
    ]
    p18_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Security company background.", "tags": ["overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Cloud security tasks.", "tags": ["duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Degree requirement.", "tags": ["education"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "unavailable", "timing": "future", "cpt": "explicitly-accepted", "opt": "explicitly-accepted"}, "rationale": "Explicit acceptance of CPT and OPT candidates alongside refusal of long-term visa sponsorship.", "tags": ["cpt-accepted", "opt-accepted", "future-refusal"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Internship perks.", "tags": ["benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "EEO statement.", "tags": ["eeo"]},
    ]
    add_p("ft-post-018", "Riptide Security", "riptide security", "policy-ft-018",
          "Security Engineering Intern", "United States", "complete",
          p18_blocks, "Explicit blocker found", ["ft-post-018-b03"], p18_ann)

    # ft-post-019: Starlight Semiconductor
    p19_blocks = [
        ("text", "Starlight Semiconductor designs energy-efficient power management integrated circuits (PMICs) for automotive applications.", 0),
        ("text", "The Hardware Design Intern will assist in schematic capture, SPICE circuit simulations, and silicon bench characterization.", 1),
        ("text", "Degree candidate in Electrical Engineering with coursework in analog integrated circuit design and semiconductor device physics.", 2),
        ("text", "Students with F-1 CPT authorization are accepted for the summer internship period. Pre-OPT and post-completion OPT are also accepted. The company does not sponsor permanent visas.", 3),
        ("text", "We provide competitive hourly wages, lab safety equipment, and housing assistance for relocated interns.", 4),
        ("text", "Starlight Semiconductor provides equal employment opportunities to all applicants regardless of race, age, or disability.", 5),
    ]
    p19_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Semiconductor company intro.", "tags": ["overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Analog circuit duties.", "tags": ["duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "EE degree requirements.", "tags": ["education"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "unavailable", "timing": "unspecified", "cpt": "explicitly-accepted", "opt": "explicitly-accepted"}, "rationale": "CPT accepted and Pre-OPT/OPT accepted, with general refusal of permanent visa sponsorship.", "tags": ["cpt-accepted", "opt-accepted", "sponsorship-unavailable"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Wages and housing assistance.", "tags": ["benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Equal employment notice.", "tags": ["eeo"]},
    ]
    add_p("ft-post-019", "Starlight Semiconductor", "starlight semiconductor", "policy-ft-019",
          "Hardware Design Intern", "United States", "complete",
          p19_blocks, "Explicit blocker found", ["ft-post-019-b03"], p19_ann)

    # =========================================================================
    # 6. CPT AND OPT EXCLUSION (2 postings)
    # =========================================================================

    # ft-post-020: Timberline Financial
    p20_blocks = [
        ("text", "Timberline Financial provides retail banking platforms and digital loan origination workflows for regional credit unions.", 0),
        ("text", "Associate Software Engineer Interns will build customer-facing micro-frontends in React and write automated unit tests.", 1),
        ("text", "Requirements: Enrolled in a BS degree in Computer Science, Software Engineering, or Information Technology.", 2),
        ("text", "We do not provide visa sponsorship of any kind, including practical training programs such as CPT and OPT.", 3),
        ("text", "Interns benefit from paid holiday time, comprehensive 401(k) eligibility, and modern development hardware.", 4),
        ("text", "Timberline Financial is dedicated to equitable hiring practices across all departments.", 5),
    ]
    p20_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Banking software overview.", "tags": ["overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Frontend web duties.", "tags": ["duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Degree requirement.", "tags": ["education"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "unavailable", "timing": "unspecified", "cpt": "explicitly-excluded", "opt": "explicitly-excluded"}, "rationale": "Explicit exclusion of visa sponsorship including practical training programs CPT and OPT.", "tags": ["cpt-excluded", "opt-excluded", "explicit-refusal"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "401k and equipment.", "tags": ["benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "EEO notice.", "tags": ["eeo"]},
    ]
    add_p("ft-post-020", "Timberline Financial", "timberline financial", "policy-ft-020",
          "Associate Software Engineer Intern", "United States", "complete",
          p20_blocks, "Explicit blocker found", ["ft-post-020-b03"], p20_ann)

    # ft-post-021: Umbra Technologies
    p21_blocks = [
        ("text", "Umbra Technologies develops resilient distributed storage systems and mission-critical cloud file backup appliances.", 0),
        ("text", "The Systems Engineering Intern will implement asynchronous I/O primitives in Rust and optimize disk write caching algorithms.", 1),
        ("text", "Qualifications include pursuit of a Computer Science or Systems Engineering degree with operating systems coursework.", 2),
        ("text", "Candidates requiring CPT or OPT work authorization are explicitly excluded from consideration. Visa sponsorship is not offered.", 3),
        ("text", "Position offers competitive compensation, dedicated engineering mentors, and potential conversion to full-time.", 4),
        ("text", "Umbra Technologies is an equal opportunity employer committed to fair treatment of all applicants.", 5),
    ]
    p21_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Storage technology intro.", "tags": ["overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Rust storage duties.", "tags": ["duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "OS course requirement.", "tags": ["education"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "unavailable", "timing": "unspecified", "cpt": "explicitly-excluded", "opt": "explicitly-excluded"}, "rationale": "Explicit exclusion of candidates requiring CPT or OPT authorization alongside refusal of visa sponsorship.", "tags": ["cpt-excluded", "opt-excluded", "explicit-refusal"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Internship perks.", "tags": ["benefits"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "EEO statement.", "tags": ["eeo"]},
    ]
    add_p("ft-post-021", "Umbra Technologies", "umbra technologies", "policy-ft-021",
          "Systems Engineering Intern", "United States", "complete",
          p21_blocks, "Explicit blocker found", ["ft-post-021-b03"], p21_ann)

    # =========================================================================
    # 7. SEPARATE DETERMINISTIC RESTRICTIONS (1 posting)
    # =========================================================================

    # ft-post-022: Vanguard Defense Systems
    p22_blocks = [
        ("text", "Vanguard Defense Systems develops tactical avionics software and encrypted radio communication links for defense applications.", 0),
        ("text", "As a Defense Software Intern, you will verify flight control software against DO-178C standards using C++ and Python.", 1),
        ("text", "Enrolled in an accredited degree program in Aerospace Engineering, Computer Engineering, or Computer Science.", 2),
        ("text", "This position supports sensitive defense programs. U.S. Citizenship is strictly required.", 3),
        ("text", "Candidate must be able to obtain and maintain an active U.S. Department of Defense Secret clearance.", 4),
        ("text", "We provide competitive wages, security clearance sponsorship processing, and housing relocation stipends.", 5),
    ]
    p22_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Defense company intro.", "tags": ["overview"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Flight software verification.", "tags": ["duties"]},
        {"gold": {"relevance": "irrelevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Accredited degree enrollment.", "tags": ["education"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Mandatory U.S. citizenship requirement; relevant to eligibility but does not establish visa sponsorship availability.", "tags": ["deterministic-restriction", "citizenship"]},
        {"gold": {"relevance": "relevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Mandatory security clearance requirement; separate deterministic restriction.", "tags": ["deterministic-restriction", "clearance"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Clearance processing benefits.", "tags": ["benefits"]},
    ]
    add_p("ft-post-022", "Vanguard Defense Systems", "vanguard defense systems", "policy-ft-022",
          "Defense Software Intern", "United States", "complete",
          p22_blocks, "Explicit blocker found", ["ft-post-022-b03", "ft-post-022-b04"], p22_ann)

    # =========================================================================
    # 8. OPERATIONAL CHALLENGE SET (3 postings: incomplete, missing-context, oversized)
    # =========================================================================

    # ft-post-023: Wildflower Software (Incomplete posting extraction challenge)
    p23_blocks = [
        ("text", "Wildflower Software designs botanical inventory and plant growth sensor analytics tools for greenhouse growers.", 0),
        ("text", "The Software Engineering Intern will maintain data visualizers in React and TypeScript...", 1),
        ("text", "[EXTRACTION INCOMPLETE: Document parsing was terminated unexpectedly by crawler timeout]", 2),
    ]
    p23_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Company intro.", "tags": ["challenge", "incomplete-extraction"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Incomplete duties block.", "tags": ["challenge", "incomplete-extraction"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Parser truncation notice.", "tags": ["challenge", "incomplete-extraction"]},
    ]
    add_p("ft-post-023", "Wildflower Software", "wildflower software", "policy-ft-023",
          "Software Engineering Intern", "United States", "incomplete",
          p23_blocks, "Could not verify", [], p23_ann)

    # ft-post-024: Xenon Cloud (Missing-context gap challenge)
    # Context group has firstPosition=0, lastPosition=3, but position 1 was omitted during capture
    p24_gid = "ft-post-024:main"
    p24_blocks = [
        make_block("ft-post-024-b00", "Xenon Cloud provides high-speed telemetry and container orchestration services for multi-cloud deployments.", p24_gid, 0),
        # Gap: position 1 missing!
        make_block("ft-post-024-b02", "This requirement applies to all intern and co-op cohorts across our North American engineering centers.", p24_gid, 2),
        make_block("ft-post-024-b03", "Xenon Cloud provides comprehensive engineering mentorship and competitive compensation.", p24_gid, 3),
    ]
    p24_groups = [make_group(p24_gid, 0, 3, start="boundary", end="boundary")]
    p24 = make_posting("ft-post-024", "Xenon Cloud", "xenon cloud", "policy-ft-024",
                       "Cloud Infrastructure Intern", "United States", "incomplete",
                       p24_groups, p24_blocks, "Could not verify", [])
    postings.append(p24)

    # Ann for p24
    rec_b00 = make_target_record(f"ft-rec-{rec_counter:04d}", p24, p24_blocks[0],
                                 {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"},
                                 "Company intro.", ["challenge", "missing-context-gap"])
    rec_counter += 1
    # b02 has previousStatus='missing' due to position 1 gap
    rec_b02 = make_target_record(f"ft-rec-{rec_counter:04d}", p24, p24_blocks[1],
                                 {"relevance": "relevant", "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"},
                                 "Demonstrative reference target with missing antecedent neighbor (position 1 lost in extraction).", ["challenge", "missing-context-gap"])
    rec_counter += 1
    rec_b03 = make_target_record(f"ft-rec-{rec_counter:04d}", p24, p24_blocks[2],
                                 {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"},
                                 "Benefits block.", ["challenge", "missing-context-gap"])
    rec_counter += 1
    targets.extend([rec_b00, rec_b02, rec_b03])

    # ft-post-025: YieldFlow Capital (Oversized block challenge > 32,000 characters)
    oversized_text = "YieldFlow Capital Quantitative High Frequency Trading System Specification. " + ("The system requires microsecond-level order execution, kernel-bypass network interface acceleration, and lock-free message passing queues across Linux trading engines. " * 300)
    p25_blocks = [
        ("text", "YieldFlow Capital develops automated algorithmic market making engines for global digital asset liquidity.", 0),
        ("text", oversized_text, 1),
        ("text", "Equal opportunity employer in quantitative finance.", 2),
    ]
    p25_ann = [
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Company intro.", "tags": ["challenge", "oversized-target"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "Massive oversized systems specification exceeding model context length (>32,000 characters).", "tags": ["challenge", "oversized-target"]},
        {"gold": {"relevance": "irrelevant", "scope": "none", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}, "rationale": "EEO statement.", "tags": ["challenge", "oversized-target"]},
    ]
    add_p("ft-post-025", "YieldFlow Capital", "yieldflow capital", "policy-ft-025",
          "Quantitative Trading Systems Intern", "United States", "incomplete",
          p25_blocks, "Could not verify", [], p25_ann)

    return postings, targets


if __name__ == "__main__":
    postings, targets = build_fresh_test_data()
    print(f"Generated {len(postings)} fresh-test postings and {len(targets)} reviewed targets.")
    no_policy = [p for p in postings if p["goldHeadline"] == "No blocker found"]
    print(f"No-policy subset: {len(no_policy)} postings from {len({p['employerGroup'] for p in no_policy})} distinct employers.")
