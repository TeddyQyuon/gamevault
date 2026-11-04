# GameVault nonpayment logo audit — 4 November 2026

## Outcome

All 25 provider/platform registry entries now use 23 self-hosted, original provider assets. No drawn approximation, typed wordmark, custom colour filter or cropped provider symbol is used by the registry. Fourteen game portraits remain the publisher-provided Steam covers already documented in `sources.json`.

The 37 published catalogue rows were read from `/api/products`: every old provider artwork path is covered by the migration map. `resolveArtworkSource` upgrades only the known legacy paths; custom merchant images and publisher game covers keep their existing source. New `/assets/storefront/official/` paths avoid stale copies of the previous icons.

Original SVG/PNG/JPEG bytes are preserved and fingerprinted with SHA-256 in `public/assets/storefront/sources.json`. SVG fragments copied from official website markup/sprites retain their original paths and viewBox. They are never approximated with font text or icon-library geometry.

Some entries deliberately use an official parent mark: Discord Nitro and Boost display the Discord symbol; Microsoft 365 displays the official Microsoft wordmark. Product/service names remain ordinary UI text beside those marks. This avoids inventing an unavailable service-specific emblem. Xbox Game Pass now uses the real Game Pass wordmark from the current Xbox website rather than the parent Xbox symbol.

## Inventory

| Registry entry | Original local asset | Official source or publisher distribution |
| --- | --- | --- |
| Xbox Game Pass (`game-pass-ultimate`) | `xbox-game-pass.png` | [Source](https://cms-assets.xboxservices.com/assets/dc/a1/dca12e01-f367-4d86-a2c8-1ef23bfd593a.png?n=Game-Pass_SKU-Chart-0_3x-XGP-Logo-540_1225x150.png) |
| PlayStation Plus (`playstation-plus`) | `ps-plus.svg` | [Source](https://www.playstation.com/en-sg/ps-plus/) |
| Nintendo Switch Online (`nintendo-switch-online`) | `nintendo-online.svg` | [Source](https://www.nintendo.com/sg/nintendo-switch-online/regions/img/img-logo.svg) |
| EA Play (`ea-play`) | `ea-play.png` | [Source](https://media.contentapi.ea.com/content/dam/eacom/subscription/ea-play/common/embed-code/color/ea-play-logo-hyper-crimson.png) |
| Discord Nitro (`discord-nitro`) | `discord.svg` | [Source](https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d7f4ef6498ac018f2c55_Symbol.svg) |
| Discord (`discord-boost`) | `discord.svg` | [Source](https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d7f4ef6498ac018f2c55_Symbol.svg) |
| Netflix (`netflix`) | `netflix.png` | [Source](https://assets.ctfassets.net/4cd45et68cgf/5vCbQ45TfVUvWgm8eiDOtn/ef1c2431dc81f79ae93fcce649ae796f/Netflix_Symbol.zip) |
| Spotify (`spotify-premium`) | `spotify.svg` | [Source](https://developer.spotify.com/images/guidelines/design/2024-spotify-logo-icon.zip) |
| Disney+ (`disney-plus`) | `disney.png` | [Source](https://cnbl-cdn.bamgrid.com/assets/3e17693b8248ad37a66f8d92439647627185b4da03e64e88c0b6edc7fb67fb7f/original) |
| YouTube (`youtube-premium`) | `youtube.png` | [Source](https://www.gstatic.com/marketing-cms/89/d9/cf95c4f345709f4998dc581221b0/youtube-icon.zip) |
| Crunchyroll (`crunchyroll-premium`) | `crunchyroll.jpg` | [Source](https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/51/e2/8f/51e28f69-7bc1-d9e1-5c7e-d636f53ed0d2/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg) |
| Apple Music (`apple-music`) | `apple-music.png` | [Source](https://www.apple.com/v/apple-music/ah/images/overview/apple_music_app_icon__ehrv06ssfpea_large.png) |
| Microsoft 365 (`microsoft-365`) | `microsoft365.png` | [Source](https://uhf.microsoft.com/images/microsoft/RE1Mu3b.png) |
| Canva (`canva-pro`) | `canva.jpg` | [Source](https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/b3/61/b0/b361b0a6-4295-6738-be3d-0f97418cfbf9/AppIcon-0-0-1x_U007epad-0-11-0-85-220.png/512x512bb.jpg) |
| Adobe (`adobe-creative-cloud`) | `adobe.svg` | [Source](https://www.adobe.com/cc-shared/assets/img/product-icons/svg/creative-cloud.svg) |
| NordVPN (`nordvpn`) | `nordvpn.jpg` | [Source](https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/b1/28/64/b1286427-ec8b-81b0-26d8-9c0523cf1efc/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg) |
| Steam (`steam`) | `steam.svg` | [Source](https://store.fastly.steamstatic.com/public/shared/images/header/logo_steam.svg?t=962016) |
| PlayStation (`psn`) | `playstation.svg` | [Source](https://www.playstation.com/etc.clientlibs/global_pdc/clientlibs/auto-clientlibs/pdc.designkit/resources/ps-icons-map__dig__brand.svg#ps-icon_brand_playstation-family_logo) |
| Xbox (`xbox`) | `xbox.png` | [Source](https://uhf.microsoft.com/images/xbox/RW8TP2.png) |
| Nintendo (`nintendo`) | `nintendo.svg` | [Source](https://www.nintendo.co.jp/common/v2/img/ncommon/_common/logo/switch.svg) |
| Apple (`apple`) | `apple.svg` | [Source](https://www.apple.com/apple-music/) |
| Google Play (`googleplay`) | `googleplay.svg` | [Source](https://play.google.com/store/games) |
| Roblox (`roblox`) | `roblox.svg` | [Source](https://about.roblox.com/images/Roblox_Logo_White.svg) |
| Razer (`razer`) | `razer.svg` | [Source](https://assets2.razerzone.com/images/phoenix/razer-ths-logo.svg) |
| Discord (`discord`) | `discord.svg` | [Source](https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d7f4ef6498ac018f2c55_Symbol.svg) |

## Rendering and verification

- Provider images keep `object-fit: contain`; original fills/gradients are retained. Backgrounds provide contrast for native white or black versions.
- Authenticated provider data was not changed. No checkout, account, payment, price, stock or fulfilment changes were made.
- Official byte fingerprint/provenance test covers all 25 entries, checks vector files for executable content and typed substitutions, and verifies legacy-source migration while preserving custom merchant art and game covers.
- `npm test`: 35/37 pass. The two remaining pre-existing failures are unrelated: the old Antigravity manifest assertion and Windows-only repository preset paths in `tests/coder-pwa.test.js`. They are unchanged.
- `npm run build`: passed. `npm run lint`: passed with no warnings. `git diff --check`: passed.
- Download sources and local files were inspected. App icons and raster wordmarks were visually checked. Final hosted rendering of this commit is the release owner's final check.

## Acquisition notes

The official Spotify and Netflix brand archives supply the exact RGB assets. Discord and Razer files come from their official brand website CDNs. Google Play is the unchanged inline multicolour mark from its official store. YouTube is its current red icon from the official YouTube asset archive. Canva, Crunchyroll and NordVPN use publisher-supplied App Store icons, with original publisher identity and URLs recorded. The direct NordVPN press kit was inaccessible, so no imitation or icon-library substitute was used.

Unused old asset files remain for compatibility, but the current provider registry and every known old catalogue logo URL resolve to the verified `/official/` assets. All five old malformed payment assets and their misleading source records were removed in the parallel payment-logo update.
