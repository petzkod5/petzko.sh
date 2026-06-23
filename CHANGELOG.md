## [1.14.1](https://github.com/petzkod5/petzko.sh/compare/v1.14.0...v1.14.1) (2026-06-23)


### Bug Fixes

* **system:** label each node gauge as cpu [bar] value / mem [bar] value ([f0ab904](https://github.com/petzkod5/petzko.sh/commit/f0ab904e8fa20f69f931808ac6f04093a48baf21))

# [1.14.0](https://github.com/petzkod5/petzko.sh/compare/v1.13.0...v1.14.0) (2026-06-23)


### Features

* **edge:** telemetry ingest + fleet read endpoints ([519d6f3](https://github.com/petzkod5/petzko.sh/commit/519d6f3b8423aebed97575f89533838ac6b5116a))
* **frontend:** :system section with live fleet telemetry ([9b645b2](https://github.com/petzkod5/petzko.sh/commit/9b645b209e59db3a88518a0932d58fda9e1b1f93))

# [1.13.0](https://github.com/petzkod5/petzko.sh/compare/v1.12.0...v1.13.0) (2026-06-23)


### Bug Fixes

* atomic content upsert + clear stale draft cache ([bd1d125](https://github.com/petzkod5/petzko.sh/commit/bd1d125070885207868b7cb2b3bd7da830c1e0ea))
* merge live content per-key over bundled fallback ([5b94418](https://github.com/petzkod5/petzko.sh/commit/5b9441892f83ae27c1da2a09b2b7e4100f139a1a))
* portal admin overlay to body so CRT layers don't bleed over it ([6386680](https://github.com/petzkod5/petzko.sh/commit/6386680f48c430c039918a28b075b90863d1921c))


### Features

* admin panel UI, Phase 1 (localStorage-backed) ([7ae3dfe](https://github.com/petzkod5/petzko.sh/commit/7ae3dfe77b67efa6224a61a9d923f3ceaada0dcb))
* **admin:** handle expired session on save + confirm reset-to-seed ([0edc789](https://github.com/petzkod5/petzko.sh/commit/0edc7899b359f2bcd19cc88bbad9171491ed2d8e))
* **admin:** live markdown preview for the About body ([9f29567](https://github.com/petzkod5/petzko.sh/commit/9f29567168b5cdec1db25d9fe6852a731626fdca))
* **admin:** surface which section a save was rejected for ([6ae9eaa](https://github.com/petzkod5/petzko.sh/commit/6ae9eaa531823aa23dae5521d33736c9a22c2630))
* **edge:** content + admin Worker endpoints ([82b9c4c](https://github.com/petzkod5/petzko.sh/commit/82b9c4cbdfe3cb3c1e6701f8090125f2ef8c44a9))
* **edge:** D1 content table + seed migrations ([907367d](https://github.com/petzkod5/petzko.sh/commit/907367d88803b8fe0637910810a1fe04fb8a93a8))
* Phase 2 — D1 as content source of truth ([6e7a8d1](https://github.com/petzkod5/petzko.sh/commit/6e7a8d14a8fba6621959c5adbf074081cf85f9ea))


### Performance Improvements

* lazy-load the admin overlay ([a675e17](https://github.com/petzkod5/petzko.sh/commit/a675e17e21b7881e865ba148b254a5aebabc17e6))

# [1.12.0](https://github.com/petzkod5/petzko.sh/compare/v1.11.3...v1.12.0) (2026-06-23)


### Features

* admin section gated by Cloudflare Access ([034ae08](https://github.com/petzkod5/petzko.sh/commit/034ae08e85fd36107c3258f7f037ed7ad6a5a134))

## [1.11.3](https://github.com/petzkod5/petzko.sh/compare/v1.11.2...v1.11.3) (2026-06-21)


### Bug Fixes

* **frontend:** theme the selected-tile background wash ([1ab31dc](https://github.com/petzkod5/petzko.sh/commit/1ab31dc20a2c9819679e922009b8dcf3865e2e79))

## [1.11.2](https://github.com/petzkod5/petzko.sh/compare/v1.11.1...v1.11.2) (2026-06-21)


### Bug Fixes

* **frontend:** theme the boot welcome screen background ([36d7f27](https://github.com/petzkod5/petzko.sh/commit/36d7f275304ca4ab77b7c2ae8c1687aa2e583eb6))

## [1.11.1](https://github.com/petzkod5/petzko.sh/compare/v1.11.0...v1.11.1) (2026-06-21)


### Bug Fixes

* **frontend:** tint the resume PDF to the active theme ([83c1d21](https://github.com/petzkod5/petzko.sh/commit/83c1d21edf81497733d320149fd99e7867aabfbc))

# [1.11.0](https://github.com/petzkod5/petzko.sh/compare/v1.10.1...v1.11.0) (2026-06-21)


### Features

* **frontend:** degauss flicker transition on theme change ([9f8443d](https://github.com/petzkod5/petzko.sh/commit/9f8443d0d2e80fb4c3c9f02b1f1c0a1704f2b64e))

## [1.10.1](https://github.com/petzkod5/petzko.sh/compare/v1.10.0...v1.10.1) (2026-06-21)


### Bug Fixes

* **frontend:** meet AA contrast for amber/ibm secondary text ([c9ec3ef](https://github.com/petzkod5/petzko.sh/commit/c9ec3ef1a0532b888be948aaf250609e3f63ba2b)), closes [#b9742a](https://github.com/petzkod5/petzko.sh/issues/b9742a) [#3a8ad0](https://github.com/petzkod5/petzko.sh/issues/3a8ad0)
* **frontend:** no-op on unknown :theme name ([c90057d](https://github.com/petzkod5/petzko.sh/commit/c90057d2fbfd4a1add98b415c935555769549536))
* **frontend:** theme command, header hotkey, drop metadata row ([5a44c5c](https://github.com/petzkod5/petzko.sh/commit/5a44c5c7561a302031d6444acb4a865ffa2983eb))

# [1.10.0](https://github.com/petzkod5/petzko.sh/compare/v1.9.0...v1.10.0) (2026-06-21)


### Bug Fixes

* **frontend:** theme the primary highlight colour (row selection) ([f08ab42](https://github.com/petzkod5/petzko.sh/commit/f08ab4270842f369d9f2e0031a926cf2ddda4223))


### Features

* **frontend:** CRT theme switcher (green / amber / ibm blue / white) ([936a4f4](https://github.com/petzkod5/petzko.sh/commit/936a4f456ac0a8e4ac0c7c15e00de56478f2d608))

# [1.9.0](https://github.com/petzkod5/petzko.sh/compare/v1.8.0...v1.9.0) (2026-06-21)


### Features

* **frontend:** authentic retro terminal fonts (Px437 BIOS + VT323 TUI) ([cf0ab76](https://github.com/petzkod5/petzko.sh/commit/cf0ab76d1d37100d3891a6135b85ded050199620))

# [1.8.0](https://github.com/petzkod5/petzko.sh/compare/v1.7.2...v1.8.0) (2026-06-20)


### Features

* guest log — hidden :sign easter egg with terminal REPL modal ([5ac1920](https://github.com/petzkod5/petzko.sh/commit/5ac19206936874a013c77249e0dc28fb3512dadc))
* live site stats — edge Worker + D1, wired into the stats section ([c43db9c](https://github.com/petzkod5/petzko.sh/commit/c43db9ca7f7056d7bb18750624ff7c2353b705a0))

## [1.7.2](https://github.com/petzkod5/petzko.sh/compare/v1.7.1...v1.7.2) (2026-06-19)


### Bug Fixes

* **deps:** update nginxinc/nginx-unprivileged docker tag to v1.31 ([#12](https://github.com/petzkod5/petzko.sh/issues/12)) ([9e36f89](https://github.com/petzkod5/petzko.sh/commit/9e36f89a795646b84c6e249798044c50e1807a5b))

## [1.7.1](https://github.com/petzkod5/petzko.sh/compare/v1.7.0...v1.7.1) (2026-06-19)


### Bug Fixes

* **deps:** update golang docker tag to v1.26 ([#23](https://github.com/petzkod5/petzko.sh/issues/23)) ([9e4c4c7](https://github.com/petzkod5/petzko.sh/commit/9e4c4c78834b4c29a142d4b632cbd0cdab57c0a4))

# [1.7.0](https://github.com/petzkod5/petzko.sh/compare/v1.6.1...v1.7.0) (2026-06-19)


### Features

* add 'stats' section (coming-soon placeholder) ([9631452](https://github.com/petzkod5/petzko.sh/commit/9631452a945a337f36820a5784cbb6e857f205c8))

## [1.6.1](https://github.com/petzkod5/petzko.sh/compare/v1.6.0...v1.6.1) (2026-06-19)


### Bug Fixes

* **deps:** update dependency node to v22.23.0 ([#11](https://github.com/petzkod5/petzko.sh/issues/11)) ([02752c5](https://github.com/petzkod5/petzko.sh/commit/02752c5bd5a8ee330151470584af23291eb88600))

# [1.6.0](https://github.com/petzkod5/petzko.sh/compare/v1.5.0...v1.6.0) (2026-06-19)


### Features

* SEO basics — robots.txt, sitemap.xml, JSON-LD, canonical ([d937e27](https://github.com/petzkod5/petzko.sh/commit/d937e270e5e43b31a848a2424b16f7592992f644))

# [1.5.0](https://github.com/petzkod5/petzko.sh/compare/v1.4.1...v1.5.0) (2026-06-19)


### Features

* retro 80s loading splash for the resume viewport ([81eefb1](https://github.com/petzkod5/petzko.sh/commit/81eefb1dd4cdae6861a4221a84c4d13a4aac47ac))

## [1.4.1](https://github.com/petzkod5/petzko.sh/compare/v1.4.0...v1.4.1) (2026-06-19)


### Bug Fixes

* **chart:** give backend a distinct app name so frontend Service doesn't select it ([bcdf80e](https://github.com/petzkod5/petzko.sh/commit/bcdf80ef358dc8626b2c368031d338ff543e3dac))

# [1.4.0](https://github.com/petzkod5/petzko.sh/compare/v1.3.5...v1.4.0) (2026-06-19)


### Features

* serve resume live from latest release via resume-proxy backend ([ae8ae18](https://github.com/petzkod5/petzko.sh/commit/ae8ae18370dd1e73b4f65331a733387938f483bb))

## [1.3.5](https://github.com/petzkod5/petzko.sh/compare/v1.3.4...v1.3.5) (2026-06-19)


### Bug Fixes

* **deps:** update remark ([#9](https://github.com/petzkod5/petzko.sh/issues/9)) ([bedd537](https://github.com/petzkod5/petzko.sh/commit/bedd53766fd0a071e481e488bbbb2e2835d60d67))

## [1.3.4](https://github.com/petzkod5/petzko.sh/compare/v1.3.3...v1.3.4) (2026-06-19)


### Bug Fixes

* **deps:** update dependency yaml to ^2.9.0 ([#8](https://github.com/petzkod5/petzko.sh/issues/8)) ([e7b00f5](https://github.com/petzkod5/petzko.sh/commit/e7b00f54f5bac15c9523aa6ec637e42677ffa864))

## [1.3.3](https://github.com/petzkod5/petzko.sh/compare/v1.3.2...v1.3.3) (2026-06-19)


### Bug Fixes

* **deps:** update dependency react-pdf to ^9.2.1 ([#7](https://github.com/petzkod5/petzko.sh/issues/7)) ([471e89f](https://github.com/petzkod5/petzko.sh/commit/471e89ff07b37bdc586dd41ece5e8f59b366997b))

## [1.3.2](https://github.com/petzkod5/petzko.sh/compare/v1.3.1...v1.3.2) (2026-06-19)


### Bug Fixes

* **deps:** update dependency react-icons to ^5.6.0 ([#6](https://github.com/petzkod5/petzko.sh/issues/6)) ([74db0df](https://github.com/petzkod5/petzko.sh/commit/74db0df423d3f539ffc4d57028967455e412c542))

## [1.3.1](https://github.com/petzkod5/petzko.sh/compare/v1.3.0...v1.3.1) (2026-06-19)


### Bug Fixes

* **security:** patch base-image OS package CVEs ([058dba3](https://github.com/petzkod5/petzko.sh/commit/058dba3d8c1ee3a45e7babe8d3afdd2acd683d61))
* **security:** read-only root filesystem + seccomp profile ([e84ff9c](https://github.com/petzkod5/petzko.sh/commit/e84ff9cc143660f2143c9e5ca95e5f76538dcf8a))

# [1.3.0](https://github.com/petzkod5/petzko.sh/compare/v1.2.0...v1.3.0) (2026-06-19)


### Features

* add favicon from the terminal UI ([3e848d9](https://github.com/petzkod5/petzko.sh/commit/3e848d9097fbe650b3c0d0aea5c14bc107f38fd7))
* new site description and rich link-preview card ([23cbc1d](https://github.com/petzkod5/petzko.sh/commit/23cbc1dbe5234ce9b07af8d4896abece6d3aac4f))

# [1.2.0](https://github.com/petzkod5/petzko.sh/compare/v1.1.0...v1.2.0) (2026-06-19)


### Features

* **frontend:** touch-friendly navigation for mobile ([1b78caf](https://github.com/petzkod5/petzko.sh/commit/1b78caf84f1db33370c7dd9dadcdbc31702d8196))

# [1.1.0](https://github.com/petzkod5/petzko.sh/compare/v1.0.0...v1.1.0) (2026-06-19)


### Features

* **frontend:** show app version in the Build header line ([519ad1f](https://github.com/petzkod5/petzko.sh/commit/519ad1f3fb2668f32f656a532f9042acb72fc946))

# 1.0.0 (2026-06-19)


### Features

* **deploy:** add Helm chart and cross-platform build ([51183c4](https://github.com/petzkod5/petzko.sh/commit/51183c4de5f2fc9dcb58ab48d4fecb780edad6d5))
* **deploy:** own ArgoCD Application manifests in-repo ([0b4818f](https://github.com/petzkod5/petzko.sh/commit/0b4818fdc218a39844c25909a2b75a010c9b6366))
* **frontend:** add phosphor-persistence smear on pane scroll ([131c148](https://github.com/petzkod5/petzko.sh/commit/131c148a6b7a38e478b0bfc3134c1211dd220f8b))
* **frontend:** boot into a BIOS POST log then the welcome card ([e2f9fe4](https://github.com/petzkod5/petzko.sh/commit/e2f9fe433fe6bfafd450e73b7986030bb2cd2355))
* **frontend:** build CRT-themed terminal portfolio ([a6f5542](https://github.com/petzkod5/petzko.sh/commit/a6f5542bd4147da3835f16ff98f4c3c8d4f77beb))
