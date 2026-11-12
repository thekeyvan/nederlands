# Mijn Nederlands

Een rustige, persoonlijke startpagina om Nederlands te oefenen op A2–B1.

- Korte uitleg en drie concrete stappen per bron
- Filters per vaardigheid en niveau, zoeken en bewaarde bronnen
- Een weekplan dat elke maandag opnieuw begint
- Gespreksvragen en een timer van twintig minuten
- Geen account, database, tracking of betaalde API nodig

Bronnen en teksten staan in `data.js`. Voortgang en favorieten staan alleen in de browser (`localStorage`). Ze worden niet tussen apparaten gedeeld. De timer werkt in het geopende tabblad; hij overleeft geen herladen pagina.

## Lokaal

Start een gewone statische webserver in deze map. Bijvoorbeeld `python3 -m http.server 8080`. Open daarna `http://localhost:8080`.

`npm test` controleert bronnen, filters, weekovergangen en opgeslagen gegevens. Er zijn geen pakketafhankelijkheden.

## Publicatie

GitHub Pages publiceert de hoofdmap van `main`. Het domein is `nederlands.keyvanmahmoudi.com`. Het DNS-record voor `nederlands` wijst naar `thekeyvan.github.io`.

De bronnen komen uit een studielijst van Regina Coeli, aangevuld met De Slimme Nieuwslezer. De website geeft korte eigen uitleg en opdrachten. Commerciële merken en externe inhoud blijven van hun eigenaren. Niet alle gewone media zijn op CEFR-niveau geschreven; B1+ is een praktische waarschuwing voor moeilijker materiaal.
