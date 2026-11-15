// Extra example sentences per grammar pattern, so one pattern gives a short round of exercises.
// Each entry: [Dutch sentence, the word that is left out in a gap exercise, Persian translation, optional hint].
// The left-out word appears exactly once in its sentence.
export const grammarExamples = {
  'zin:v2': [
    ['Morgen werk ik thuis.', 'werk', 'فردا در خانه کار می‌کنم.'],
    ['In het weekend gaan we fietsen.', 'gaan', 'آخر هفته دوچرخه‌سواری می‌کنیم.'],
    ['Op maandag heb ik Nederlandse les.', 'heb', 'دوشنبه‌ها کلاس هلندی دارم.'],
  ],
  'zin:dat': [
    ['Ik denk dat het morgen gaat regenen.', 'gaat', 'فکر می‌کنم فردا باران می‌بارد.'],
    ['Ze zegt dat ze vandaag thuis werkt.', 'werkt', 'می‌گوید امروز در خانه کار می‌کند.'],
    ['Ik hoop dat je snel beter wordt.', 'wordt', 'امیدوارم زود خوب شوی.'],
  ],
  'zin:omdat': [
    ['Ik kom later omdat de trein vertraging heeft.', 'heeft', 'دیرتر می‌آیم چون قطار تأخیر دارد.'],
    ['Ik neem een taxi, want het regent.', 'want', 'تاکسی می‌گیرم، چون باران می‌بارد.'],
    ['We eten thuis omdat het restaurant dicht is.', 'is', 'در خانه غذا می‌خوریم چون رستوران بسته است.'],
  ],
  'zin:als': [
    ['Als het mooi weer is, gaan we naar het strand.', 'gaan', 'اگر هوا خوب باشد، به ساحل می‌رویم.'],
    ['Als je vragen hebt, mail je mij.', 'mail', 'اگر سؤالی داری، به من ایمیل بزن.'],
    ['Als ik moe ben, ga ik vroeg slapen.', 'ga', 'وقتی خسته‌ام، زود می‌خوابم.'],
  ],
  'zin:advies': [
    ['Als ik jou was, zou ik een jas meenemen.', 'zou', 'اگر جای تو بودم، یک کت با خودم می‌بردم.'],
    ['Als ik jou was, zou ik de huisarts bellen.', 'bellen', 'اگر جای تو بودم، به پزشک خانواده زنگ می‌زدم.'],
    ['Als ik u was, zou ik het contract goed lezen.', 'lezen', 'اگر جای شما بودم، قرارداد را با دقت می‌خواندم.'],
  ],
  'zin:kunnen': [
    ['Je mag hier niet roken.', 'mag', 'اینجا نباید سیگار بکشی.'],
    ['Ik moet om acht uur op mijn werk zijn.', 'moet', 'باید ساعت هشت سر کارم باشم.'],
    ['Kun je morgen om tien uur komen?', 'Kun', 'می‌توانی فردا ساعت ده بیایی؟'],
  ],
  'zin:hoeven': [
    ['Je hoeft niet te betalen.', 'te', 'لازم نیست پول بدهی.'],
    ['We hoeven vandaag niet vroeg op te staan.', 'hoeven', 'امروز لازم نیست زود بیدار شویم.'],
    ['U hoeft geen afspraak te maken.', 'hoeft', 'لازم نیست وقت بگیرید.'],
  ],
  'zin:geen': [
    ['Ik heb geen tijd vandaag.', 'geen', 'امروز وقت ندارم.'],
    ['Ik begrijp de vraag niet.', 'niet', 'سؤال را نمی‌فهمم.'],
    ['Wij hebben geen auto.', 'geen', 'ما ماشین نداریم.'],
  ],
  'zin:scheidbaar': [
    ['Ik hoef niet vroeg op te staan.', 'te', 'لازم نیست زود بیدار شوم.'],
    ['De trein vertrekt om negen uur en ik stap in Utrecht over.', 'over', 'قطار ساعت نه حرکت می‌کند و من در اوترخت قطار عوض می‌کنم.'],
    ['Ik moet de formulieren nog invullen.', 'invullen', 'هنوز باید فرم‌ها را پر کنم.'],
  ],
  'zin:zal-ik': [
    ['Zal ik het raam opendoen?', 'Zal', 'پنجره را باز کنم؟'],
    ['Zal ik koffie voor je halen?', 'halen', 'برایت قهوه بیاورم؟'],
    ['Zal ik je morgen bellen?', 'bellen', 'فردا به تو زنگ بزنم؟'],
  ],
  'zin:zullen-we': [
    ['Zullen we morgen gaan wandelen?', 'Zullen', 'فردا برویم پیاده‌روی؟'],
    ['Zullen we om zes uur afspreken?', 'afspreken', 'ساعت شش قرار بگذاریم؟'],
    ['Zullen we een pizza bestellen?', 'bestellen', 'یک پیتزا سفارش بدهیم؟'],
  ],
  'zin:zou-kunnen': [
    ['Zou je het raam kunnen dichtdoen?', 'kunnen', 'می‌شود پنجره را ببندی؟'],
    ['Zou u langzamer kunnen praten?', 'Zou', 'ممکن است آهسته‌تر صحبت کنید؟'],
    ['Zou je me morgen kunnen bellen?', 'bellen', 'می‌توانی فردا به من زنگ بزنی؟'],
  ],
  'zin:zou-willen': [
    ['Zou u even willen wachten?', 'willen', 'ممکن است کمی صبر کنید؟'],
    ['Zou je dit formulier willen tekenen?', 'tekenen', 'ممکن است این فرم را امضا کنی؟'],
    ['Zou u uw naam willen spellen?', 'Zou', 'ممکن است نامتان را هجی کنید؟'],
  ],
  'zin:om-te': [
    ['Ik ga naar de winkel om brood te kopen.', 'om', 'به مغازه می‌روم تا نان بخرم.'],
    ['Ze fietst naar haar werk om fit te blijven.', 'te', 'با دوچرخه سر کار می‌رود تا سرحال بماند.'],
    ['We sparen geld om een huis te kopen.', 'kopen', 'پول پس‌انداز می‌کنیم تا خانه بخریم.'],
  ],
  'zin:perfectum': [
    ['We hebben gisteren pizza gegeten.', 'gegeten', 'دیروز پیتزا خوردیم.', 'eten'],
    ['Ze heeft de hele dag gewerkt.', 'heeft', 'او تمام روز کار کرده است.'],
    ['Ik heb mijn moeder gebeld.', 'gebeld', 'به مادرم زنگ زده‌ام.', 'bellen'],
  ],
  'zin:hebben-zijn': [
    ['Ik ben naar Amsterdam gereisd.', 'ben', 'به آمستردام سفر کرده‌ام.'],
    ['We hebben een uur gewandeld.', 'hebben', 'یک ساعت پیاده‌روی کرده‌ایم.'],
    ['Hij is gisteren naar huis gegaan.', 'is', 'او دیروز به خانه رفت.'],
  ],
  'zin:veranderen': [
    ['Het weer is snel veranderd.', 'is', 'هوا سریع عوض شده است.'],
    ['Ze heeft haar wachtwoord veranderd.', 'heeft', 'او رمزش را عوض کرده است.'],
    ['Er is veel veranderd in de stad.', 'veranderd', 'در شهر خیلی چیزها عوض شده است.'],
  ],
  'zin:verleden': [
    ['Vroeger speelde ik vaak voetbal.', 'speelde', 'قبلاً زیاد فوتبال بازی می‌کردم.', 'spelen'],
    ['Gisteren heb ik een nieuwe fiets gekocht.', 'gekocht', 'دیروز یک دوچرخهٔ نو خریدم.', 'kopen'],
    ['Toen ik klein was, woonde ik in Teheran.', 'woonde', 'وقتی کوچک بودم، در تهران زندگی می‌کردم.', 'wonen'],
  ],
  'zin:dubbel': [
    ['Ik heb lang moeten wachten.', 'moeten', 'مجبور شدم مدت زیادی صبر کنم.', 'moeten'],
    ['We hebben niet kunnen slapen.', 'kunnen', 'نتوانستیم بخوابیم.', 'kunnen'],
    ['Ze heeft niet willen komen.', 'willen', 'او نخواست بیاید.', 'willen'],
  ],
  'zin:modalen-verleden': [
    ['Ik kon gisteren niet komen.', 'kon', 'دیروز نتوانستم بیایم.', 'kunnen'],
    ['We moesten lang wachten bij de dokter.', 'moesten', 'پیش دکتر مجبور شدیم مدت زیادی صبر کنیم.', 'moeten'],
    ['Hij wilde graag mee naar het feest.', 'wilde', 'او خیلی می‌خواست به مهمانی بیاید.', 'willen'],
  ],
  'zin:die-dat': [
    ['De trein die nu vertrekt, gaat naar Utrecht.', 'die', 'قطاری که الان حرکت می‌کند، به اوترخت می‌رود.'],
    ['Het huis dat we huren, is groot.', 'dat', 'خانه‌ای که اجاره می‌کنیم، بزرگ است.'],
    ['De man die daar staat, is mijn buurman.', 'die', 'مردی که آنجا ایستاده، همسایهٔ من است.'],
  ],
  'zin:daarmee': [
    ['Daar heb ik geen zin in.', 'in', 'حوصله‌اش را ندارم.'],
    ['Daar kan ik je mee helpen.', 'mee', 'در این مورد می‌توانم کمکت کنم.'],
    ['Daar denk ik nog over na.', 'over', 'هنوز دربارهٔ آن فکر می‌کنم.'],
  ],
  'zin:liever': [
    ['Ik fiets liever dan dat ik de bus neem.', 'liever', 'ترجیح می‌دهم دوچرخه سوار شوم تا اتوبوس بگیرم.'],
    ['Zij woont liever in de stad dan in een dorp.', 'dan', 'او ترجیح می‌دهد در شهر زندگی کند تا در روستا.'],
    ['Deze jas is net zo duur als die.', 'als', 'این کت به همان اندازهٔ آن یکی گران است.'],
  ],
  'zin:zo-dat': [
    ['Ik was zo moe dat ik meteen ging slapen.', 'zo', 'آن‌قدر خسته بودم که فوراً خوابیدم.'],
    ['Het eten was zo lekker dat ik nog meer wilde.', 'dat', 'غذا آن‌قدر خوشمزه بود که باز هم خواستم.'],
    ['Het regende zo hard dat we binnen bleven.', 'bleven', 'آن‌قدر شدید باران می‌بارید که داخل ماندیم.'],
  ],
  'zin:wederkerend': [
    ['Hij voelt zich niet lekker.', 'zich', 'حالش خوب نیست.'],
    ['Wij voelen ons hier thuis.', 'ons', 'اینجا احساس می‌کنیم در خانهٔ خودمانیم.'],
    ['Ik verveel me op zondag.', 'me', 'یکشنبه‌ها حوصله‌ام سر می‌رود.'],
  ],
  'zin:iedereen': [
    ['Iedereen heeft een eigen kamer.', 'heeft', 'هر کس اتاق خودش را دارد.'],
    ['Iedereen was op tijd.', 'was', 'همه سر وقت بودند.'],
    ['Iedereen mag meedoen.', 'mag', 'همه می‌توانند شرکت کنند.'],
  ],
  'zin:samenstelling': [
    ['Mijn fietssleutel ligt in de auto.', 'fietssleutel', 'کلید دوچرخه‌ام در ماشین است.'],
    ['De bushalte is om de hoek.', 'bushalte', 'ایستگاه اتوبوس سر نبش است.'],
    ['Ik zoek een tandarts in de buurt.', 'tandarts', 'دنبال یک دندان‌پزشک در این اطراف هستم.'],
  ],
  'zin:tijd-al': [
    ['Ik ben al klaar met mijn werk.', 'al', 'کارم را تمام کرده‌ام.'],
    ['De winkel gaat pas om tien uur open.', 'pas', 'مغازه تازه ساعت ده باز می‌شود.'],
    ['Hij heeft nog niet gegeten.', 'nog', 'او هنوز غذا نخورده است.'],
  ],
  'zin:vraag': [
    ['Woon jij al lang in Nederland?', 'Woon', 'خیلی وقت است در هلند زندگی می‌کنی؟'],
    ['Hebben jullie een kamer vrij?', 'Hebben', 'اتاق خالی دارید؟'],
    ['Werkt zij ook bij de gemeente?', 'Werkt', 'او هم در شهرداری کار می‌کند؟'],
  ],
  'zin:plusquamperfectum': [
    ['De film was al begonnen toen we aankwamen.', 'was', 'وقتی رسیدیم فیلم شروع شده بود.'],
    ['Ik had de deur al dichtgedaan.', 'had', 'در را بسته بودم.'],
    ['Ze had het nog nooit gezien.', 'gezien', 'او هرگز آن را ندیده بود.', 'zien'],
  ],
  'zin:tijd-manier-plaats': [
    ['We gaan morgen met de auto naar Rotterdam.', 'morgen', 'فردا با ماشین به روتردام می‌رویم.'],
    ['Ik werk vandaag graag thuis.', 'thuis', 'امروز ترجیح می‌دهم در خانه کار کنم.'],
    ['Ze is vorige week met de trein naar Parijs gereisd.', 'gereisd', 'او هفتهٔ پیش با قطار به پاریس سفر کرد.'],
  ],
  'zin:hebben-vervoegen': [
    ['Hij heeft twee kinderen.', 'heeft', 'او دو بچه دارد.'],
    ['Hebben jullie al gegeten?', 'Hebben', 'غذا خورده‌اید؟'],
    ['Jij hebt gelijk.', 'hebt', 'حق با توست.'],
  ],
  'zin:verleden-t-d': [
    ['Gisteren fietste ik naar mijn werk.', 'fietste', 'دیروز با دوچرخه سر کار رفتم.', 'fietsen'],
    ['We speelden vroeger vaak buiten.', 'speelden', 'قبلاً زیاد بیرون بازی می‌کردیم.', 'spelen'],
    ['Hij maakte een foto van de molen.', 'maakte', 'او از آسیاب بادی عکس گرفت.', 'maken'],
  ],
  'zin:deelwoord-t-d': [
    ['Ik heb de hele avond gekookt.', 'gekookt', 'تمام شب آشپزی کرده‌ام.', 'koken'],
    ['We hebben in Utrecht gewoond.', 'gewoond', 'در اوترخت زندگی کرده‌ایم.', 'wonen'],
    ['Ze heeft op de bus gewacht.', 'gewacht', 'منتظر اتوبوس مانده است.', 'wachten'],
  ],
  'zin:deelwoord-zonder-ge': [
    ['Wat is er gebeurd?', 'gebeurd', 'چه اتفاقی افتاده؟', 'gebeuren'],
    ['Ik heb het hem al verteld.', 'verteld', 'قبلاً به او گفته‌ام.', 'vertellen'],
    ['Heb je de rekening betaald?', 'betaald', 'صورت‌حساب را پرداخت کرده‌ای؟', 'betalen'],
  ],
  'zin:deelwoord-scheidbaar': [
    ['Ik heb het probleem opgelost.', 'opgelost', 'مشکل را حل کرده‌ام.', 'oplossen'],
    ['Ze is vanochtend vroeg opgestaan.', 'opgestaan', 'او امروز صبح زود بیدار شد.', 'opstaan'],
    ['Heb je de collega al opgebeld?', 'opgebeld', 'به همکار زنگ زده‌ای؟', 'opbellen'],
  ],
  'zin:onregelmatig-deelwoord': [
    ['We zijn naar Spanje gevlogen.', 'gevlogen', 'با هواپیما به اسپانیا رفته‌ایم.', 'vliegen'],
    ['Ik heb een mooi boek gelezen.', 'gelezen', 'یک کتاب خوب خوانده‌ام.', 'lezen'],
    ['Hij heeft de hele middag geslapen.', 'geslapen', 'او تمام بعدازظهر خوابیده است.', 'slapen'],
  ],
  'zin:aanwijzen': [
    ['Deze tas is van mij.', 'Deze', 'این کیف مال من است.'],
    ['Dit huis is te klein.', 'Dit', 'این خانه خیلی کوچک است.'],
    ['Die schoenen zijn nieuw.', 'Die', 'آن کفش‌ها نو هستند.'],
  ],
  'zin:verkleinwoord': [
    ['Mag ik een kopje thee?', 'kopje', 'می‌شود یک فنجان چای بگیرم؟'],
    ['Het meisje speelt met een balletje.', 'balletje', 'دختر با یک توپ کوچک بازی می‌کند.'],
    ['We drinken een biertje op het terras.', 'biertje', 'در تراس یک آبجو می‌نوشیم.'],
  ],
  'zin:anderhalf': [
    ['Ik heb anderhalve week vakantie.', 'anderhalve', 'یک هفته و نیم تعطیلی دارم.', '1,5'],
    ['De film duurt tweeënhalf uur.', 'tweeënhalf', 'فیلم دو ساعت و نیم طول می‌کشد.', '2,5'],
    ['We wachten al anderhalf uur.', 'anderhalf', 'یک ساعت و نیم است که منتظریم.', '1,5'],
  ],
  'zin:voorbereiden': [
    ['Hij bereidt zich voor op het examen.', 'zich', 'او برای امتحان آماده می‌شود.'],
    ['We bereiden ons voor op de verhuizing.', 'ons', 'برای اسباب‌کشی آماده می‌شویم.'],
    ['Ik heb me goed voorbereid.', 'voorbereid', 'خودم را خوب آماده کرده‌ام.'],
  ],
  'zin:voornaamwoord-dingen': [
    ['De fiets is kapot. Ik repareer hem morgen.', 'hem', 'دوچرخه خراب است. فردا تعمیرش می‌کنم.'],
    ['Waar is de sleutel? Hij ligt op tafel.', 'Hij', 'کلید کجاست؟ روی میز است.'],
    ['De appels zijn lekker. Ik eet ze graag.', 'ze', 'سیب‌ها خوشمزه‌اند. با کمال میل می‌خورمشان.'],
  ],
  'zin:er-voorzetsel': [
    ['Het is een goed plan. Ik denk erover na.', 'erover', 'نقشهٔ خوبی است. درباره‌اش فکر می‌کنم.'],
    ['Ik heb een vraag over de huur. Kun je ernaar kijken?', 'ernaar', 'سؤالی دربارهٔ اجاره دارم. می‌توانی به آن نگاه کنی؟'],
    ['Ik heb een nieuwe baan. Ik ben er blij mee.', 'mee', 'شغل تازه‌ای دارم. از آن راضی‌ام.'],
  ],
  'zin:zou-mogen': [
    ['Zou ik uw telefoon mogen gebruiken?', 'mogen', 'ممکن است از تلفن شما استفاده کنم؟'],
    ['Zou ik morgen vrij mogen nemen?', 'Zou', 'ممکن است فردا مرخصی بگیرم؟'],
    ['Zou ik hier even mogen zitten?', 'zitten', 'ممکن است کمی اینجا بنشینم؟'],
  ],
  'zin:nog-geen-meer': [
    ['Ik heb geen brood meer.', 'meer', 'دیگر نان ندارم.'],
    ['Wil je nog een kopje koffie?', 'nog', 'باز هم یک فنجان قهوه می‌خواهی؟'],
    ['We hoeven geen formulier meer in te vullen.', 'te', 'دیگر لازم نیست فرمی پر کنیم.'],
  ],
  'zin:toen-als': [
    ['Toen ik in Nederland aankwam, sprak ik geen Nederlands.', 'Toen', 'وقتی به هلند رسیدم، هلندی بلد نبودم.'],
    ['Als het regent, neem ik de bus.', 'Als', 'وقتی باران می‌بارد، اتوبوس سوار می‌شوم.'],
    ['Toen we klaar waren, gingen we naar huis.', 'Toen', 'وقتی کارمان تمام شد، به خانه رفتیم.'],
  ],
  'zin:indirecte-vraag': [
    ['Weet jij of de winkel open is?', 'of', 'می‌دانی مغازه باز است یا نه؟'],
    ['Ik vraag me af waar hij woont.', 'waar', 'نمی‌دانم او کجا زندگی می‌کند.'],
    ['Kun je zeggen hoe laat de trein vertrekt?', 'vertrekt', 'می‌توانی بگویی قطار چه ساعتی حرکت می‌کند؟'],
  ],
  'zin:hypothese': [
    ['Als ik rijk was, zou ik een groot huis kopen.', 'zou', 'اگر ثروتمند بودم، خانه‌ای بزرگ می‌خریدم.'],
    ['Als ik meer tijd had, zou ik vaker sporten.', 'had', 'اگر وقت بیشتری داشتم، بیشتر ورزش می‌کردم.'],
    ['Als het niet regende, zouden we buiten eten.', 'zouden', 'اگر باران نمی‌بارید، بیرون غذا می‌خوردیم.'],
  ],
};
