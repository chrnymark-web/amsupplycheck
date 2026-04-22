#!/usr/bin/env python3
"""Update outreach messages in Google Sheet with revised versions."""
import json
import subprocess
import sys

SPREADSHEET_ID = "1hJaVTvGadNCMAfimi5cT4u6hjfq-aQRJzAyUPk42Dts"

# Row number (1-indexed in sheet) -> revised message
# Column M = column 13, so range is M2, M3, etc.
messages = {
    2: """Hi Michael,

I came across 3D Printing Industry's recent coverage of emerging platforms in the AM space, and I thought our story might resonate with your readership.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com), a free platform that helps engineers and designers compare prices and capabilities across 100+ verified 3D printing suppliers worldwide. We pull live quotes from 90+ vendors so users can instantly compare pricing, lead times, and technologies, from FDM to metal AM.

We're a Danish startup (founded 2024) on a mission to democratize access to additive manufacturing. We believe finding the right supplier shouldn't require weeks of RFQs.

Would 3D Printing Industry be interested in covering our platform? Perhaps as a startup spotlight or a piece on how digital procurement is reshaping AM?

Happy to provide a demo, data, or an interview.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    3: """Hi TCT team,

As the most established publication in additive manufacturing, covering the industry since 1992, TCT is naturally where serious AM professionals turn for insight. That's exactly why I'm reaching out.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com). We've built a free platform that matches engineers with the right AM supplier from a verified network of 100+ providers across 40+ countries. Users can upload STL files and get live price comparisons from 90+ vendors instantly.

With your audience of industrial AM professionals, I believe a piece on how digital procurement tools are transforming how companies source 3D printing services could be a compelling read.

Would TCT be open to writing about us, whether as a startup feature or within a broader piece on AM supply chain innovation?

I'd be happy to arrange a demo or provide any additional details.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    4: """Hi editors,

With 8 million+ readers, All3DP is the go-to resource for anyone exploring 3D printing, from hobbyists to professionals. I'd love to get AMSupplyCheck in front of your audience.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com). We've built a free price comparison platform for 3D printing services. Think of it as a Skyscanner for 3D printing. Users upload their STL file or describe their project, and we match them with the best supplier from 100+ verified providers, with live quotes from 90+ vendors.

Whether someone needs a single PLA prototype or a batch of metal parts, we make it easy to compare options instantly. No more emailing five different services and waiting days for quotes.

Would All3DP be interested in covering our platform? Perhaps as a review, a "best tools" feature, or a startup story?

Happy to provide access, screenshots, or an interview.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    5: """Hi 3DPrint.com team,

I've been following your business-focused coverage of the AM industry, especially pieces on market strategy and business models in 3D printing. Our story fits right into that narrative.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com). We're a Danish startup that built a free supplier matching platform for additive manufacturing. With 100+ verified suppliers across 40+ countries and live pricing from 90+ vendors, we're addressing a real pain point: the fragmented, opaque process of sourcing 3D printing services.

The AM market hit $16 billion in 2025, yet finding the right supplier still involves manual RFQs and guesswork. We're changing that.

Would 3DPrint.com be interested in covering us, perhaps from a business/market angle on how platforms are disrupting AM procurement?

Happy to share data, insights, or arrange an interview.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    6: """Hi Additive Manufacturing Media team,

Your publication's focus on end-use production and functional parts speaks directly to the professionals we serve.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com). We've developed a free platform that helps engineers find the right AM supplier for production-grade work, matching project requirements with capabilities across 100+ verified providers. From aerospace-certified metal AM to high-volume polymer production, our platform covers it all with live pricing from 90+ vendors.

As AM moves further into production (aerospace, automotive, medical), efficient supplier selection becomes critical. That's the problem we solve.

Would your editorial team be interested in a piece on how digital tools are streamlining AM supplier selection for production applications?

I'd be glad to provide a walkthrough or discuss the trends we're seeing in procurement.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    7: """Hi Nick,

Metal AM magazine is the definitive resource for the metal additive manufacturing community, and I'd love to introduce a platform that serves your readers.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com). We've built a free supplier matching platform covering the full AM spectrum, including DMLS, SLM, and other metal technologies. Engineers can upload parts, specify materials (titanium, stainless steel, aluminum, etc.), and get live quotes from verified metal AM providers worldwide.

As metal AM adoption accelerates, the challenge of finding the right certified supplier for production-grade metal parts is growing. Our platform addresses this by making the comparison transparent and instant.

Would Metal AM be interested in covering our platform, particularly our metal AM supplier matching capabilities?

Happy to provide details or set up a demo.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    8: """Hi 3Dnatives team,

With over 1 million monthly visitors and coverage in five languages, 3Dnatives reaches the widest audience in 3D printing media. I'd love to share our story with your readers.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com), a free platform that helps users compare 100+ verified 3D printing suppliers worldwide. From hobbyists looking for the cheapest FDM service to engineers sourcing production-grade SLS or metal parts, we provide live quotes from 90+ vendors in one place.

As a fellow European company (we're based in Denmark), we share your vision of making 3D printing accessible to everyone, regardless of location or experience level.

Would 3Dnatives be interested in featuring our platform, whether as a startup story, tool review, or piece on digital tools in AM?

Happy to provide anything you need.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    9: """Hi VoxelMatters team,

I'm a regular reader of your market analyses and data-driven coverage of the AM industry. Your depth of insight is unmatched.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com). We've built a free platform that continuously monitors 100+ AM service providers across 40+ countries, tracking capabilities, pricing, technologies, and materials. With live pricing from 90+ vendors, we're essentially creating a real-time map of the global AM service landscape.

Given VoxelMatters' focus on market intelligence, I think our data and approach could be interesting to your audience, both as a tool and as a lens into how the AM service market is structured.

Would you be interested in covering us, or perhaps exploring a data-driven piece together on AM service market trends?

I'd love to share what we're seeing in the data.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    10: """Hi 3D ADEPT team,

I follow your coverage of the European AM ecosystem closely, and as a fellow European startup, I think our story would resonate with your audience.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com). We're a Danish platform that helps engineers and designers find the right 3D printing supplier from 100+ verified providers worldwide, with smart matching and live pricing from 90+ vendors. It's completely free.

With your Additive Talks conference series and focus on industrial AM adoption, I believe a piece on how digital platforms are reducing friction in AM procurement could be a great fit.

Would 3D ADEPT Media be open to featuring our platform?

Happy to provide a demo or join an Additive Talks discussion.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    11: """Hi Kerry,

Fabbaloo has been a trusted voice in 3D printing since 2007, with over 8,000 articles covering everything from breakthrough technologies to the tools that make 3D printing easier. I think AMSupplyCheck fits right in.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com). We've built a free platform that lets anyone, hobbyist or engineer, compare prices and capabilities across 100+ 3D printing services instantly. Upload an STL, get live quotes from 90+ vendors, and find the best match for your project.

No more Googling services, emailing for quotes, and waiting days. It's all in one place.

Would Fabbaloo be interested in reviewing or writing about our platform?

I'd be happy to give you a walkthrough.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    12: """Hi 3Printr team,

With daily updates covering the full breadth of 3D printing, 3Printr is a go-to source for staying current in the industry.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com). We're a Danish startup that built a free platform for comparing 3D printing suppliers. Users get live price quotes from 90+ vendors across 100+ verified providers, covering everything from consumer FDM to industrial metal AM.

Would 3Printr be interested in covering our launch as a news item or startup feature?

Happy to provide all the details you need.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    13: """Hi AM Chronicle team,

Your 360-degree coverage of additive manufacturing, from technology deep-dives to industry interviews, makes AM Chronicle a valuable resource for the global AM community.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com). We're a Danish startup offering a free platform that matches engineers with the right AM supplier from 100+ verified providers across 40+ countries. With live pricing from 90+ vendors, we're making supplier selection transparent and data-driven.

With India's growing AM ecosystem, I think your readers would find it valuable to learn about a platform that makes global AM services accessible from anywhere.

Would AM Chronicle be interested in featuring us, perhaps as a startup profile or an interview?

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    14: """Hi MANUFACTUR3D team,

As India's leading online 3D printing magazine, MANUFACTUR3D is where engineers, founders, and CXOs turn for AM insights. I'd love to introduce our platform to your audience.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com). We've built a free platform that helps users compare 100+ verified 3D printing suppliers worldwide using smart matching and live pricing from 90+ vendors.

For your readers in India, whether startups prototyping their first product or manufacturers looking for global sourcing options, our platform removes the guesswork from finding the right AM service.

Would MANUFACTUR3D be interested in covering us as a startup story or tool feature?

Happy to provide access and details.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    15: """Hi 3DPrinting.com team,

Your coverage spanning industry, academia, and public 3D printing projects gives a uniquely broad perspective on how AM impacts different sectors.

I'm Christian Nymark Groth, CEO of AMSupplyCheck (amsupplycheck.com). We're a free platform that matches users with the best 3D printing supplier from 100+ verified providers worldwide. With live quotes from 90+ vendors, we serve everyone from university researchers to industrial manufacturers.

Would 3DPrinting.com be interested in writing about our platform?

Happy to share more details.

Best regards,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    16: """Hallo 3Druck.com-Team,

als unabhaengiges deutschsprachiges AM-Magazin erreicht 3Druck.com genau die Community, die wir ansprechen moechten.

Mein Name ist Christian Nymark Groth, CEO von AMSupplyCheck (amsupplycheck.com). Wir sind ein daenisches Startup, das eine kostenlose Plattform entwickelt hat, auf der Ingenieure und Designer 3D-Druck-Dienstleister weltweit vergleichen koennen. Mit intelligentem Matching und Live-Preisen von ueber 90 Anbietern machen wir die Suche nach dem richtigen Lieferanten transparent und einfach, von FDM ueber SLS bis hin zu Metall-AM.

Als skandinavisches Startup mit europaeischen Wurzeln wuerden wir uns freuen, wenn 3Druck.com ueber unsere Plattform berichten wuerde, sei es als Startup-Portrait, Tool-Vorstellung oder Branchennews.

Ich stelle gerne eine Demo bereit oder beantworte Fragen.

Mit freundlichen Gruessen,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    17: """Hallo Additive Industrie-Team,

mit dem starken Fokus auf industrielle Anwendungen in der Automobilindustrie, Medizintechnik und Luftfahrt erreicht additive.industrie.de genau die Entscheider, die von unserer Plattform profitieren.

Mein Name ist Christian Nymark Groth, CEO von AMSupplyCheck (amsupplycheck.com). Wir haben eine kostenlose Plattform entwickelt, die Ingenieuren hilft, den passenden AM-Dienstleister aus ueber 100 verifizierten Anbietern in 40+ Laendern zu finden, mit Echtzeit-Preisvergleichen von ueber 90 Anbietern.

Fuer die produzierende Industrie, die zunehmend auf additive Fertigung setzt, loesen wir ein konkretes Problem: die aufwendige und intransparente Lieferantensuche.

Waere Additive Industrie an einem Bericht ueber uns interessiert, etwa als Startup-Portrait oder im Kontext der digitalen Transformation der AM-Beschaffung?

Ich freue mich auf Ihre Rueckmeldung.

Mit freundlichen Gruessen,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    18: """Hallo 3D-grenzenlos-Team,

euer Magazin bietet einen fantastischen Mix aus News, Tests und Tipps fuer die deutschsprachige 3D-Druck-Community, vom Hobbyisten bis zum Profi.

Mein Name ist Christian Nymark Groth, CEO von AMSupplyCheck (amsupplycheck.com). Wir sind ein daenisches Startup und haben eine kostenlose Plattform gebaut, auf der jeder, ob Maker oder Ingenieur, 3D-Druck-Services vergleichen kann. Einfach STL hochladen, und wir finden den besten Anbieter aus ueber 100 verifizierten Services weltweit, mit Live-Preisen von 90+ Anbietern.

So etwas wie ein Preisvergleichsportal fuer 3D-Druck, kostenlos und herstellerunabhaengig.

Wuerde 3D-grenzenlos ueber unsere Plattform berichten, als Test, Vorstellung oder Startup-Story?

Ich zeige euch gerne die Plattform.

Mit freundlichen Gruessen,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    19: """Hallo Team Additive Fertigung,

als fuehrendes oesterreichisches Fachmedium fuer additive Fertigung sind Sie eine wichtige Stimme im DACH-Raum.

Mein Name ist Christian Nymark Groth, CEO von AMSupplyCheck (amsupplycheck.com). Wir haben in Daenemark eine kostenlose Plattform entwickelt, die Ingenieuren und Unternehmen hilft, den richtigen AM-Dienstleister zu finden. Mit intelligentem Matching und Echtzeit-Preisen von ueber 90 Anbietern decken wir alle gaengigen Technologien ab, von Polymer bis Metall.

Als europaeisches Startup moechten wir besonders im DACH-Raum bekannter werden. Waere ein Bericht ueber AMSupplyCheck fuer Ihre Leserschaft interessant?

Ich stelle gerne weitere Informationen oder eine Demo bereit.

Mit freundlichen Gruessen,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",

    20: """Hallo Konstruktionspraxis-Team,

Ihr Portal ist die erste Anlaufstelle fuer Konstrukteure und Entwickler in Deutschland, und additive Fertigung wird ein immer wichtigerer Teil des Engineering-Werkzeugkastens.

Mein Name ist Christian Nymark Groth, CEO von AMSupplyCheck (amsupplycheck.com). Wir haben eine kostenlose Plattform entwickelt, die Konstrukteuren hilft, den passenden 3D-Druck-Dienstleister schnell und datenbasiert zu finden. Statt tagelang Angebote einzuholen, bekommen Ihre Leser Echtzeit-Preise von ueber 90 Anbietern und datengestuetzte Empfehlungen aus einem Netzwerk von 100+ verifizierten Services.

Gerade fuer Konstrukteure, die AM als Fertigungsoption evaluieren, kann das den Unterschied machen.

Waere konstruktionspraxis an einem Beitrag ueber digitale Tools fuer die AM-Beschaffung interessiert?

Mit freundlichen Gruessen,
Christian Nymark Groth
CEO, AMSupplyCheck
amsupplycheck.com""",
}

# Build batch update request
data = []
for row, msg in messages.items():
    data.append({
        "range": f"Ark1!M{row}",
        "values": [[msg]]
    })

body = {
    "valueInputOption": "RAW",
    "data": data
}

body_json = json.dumps(body)

cmd = [
    "gws", "sheets", "spreadsheets", "values", "batchUpdate",
    "--params", json.dumps({"spreadsheetId": SPREADSHEET_ID}),
    "--json", body_json
]

result = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", result.stdout[:2000])
print("STDERR:", result.stderr[:500])
print("Return code:", result.returncode)
