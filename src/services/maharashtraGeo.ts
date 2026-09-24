/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Comprehensive Maharashtra Geographic & Administrative Database
 * Contains all 36 Districts of Maharashtra with official English, Marathi, and Hindi names,
 * geographical coordinates, major talukas, and distance calculation utilities.
 */

export interface MaharashtraDistrict {
  id: string;
  nameEn: string;
  nameMr: string;
  nameHi: string;
  division: 'Konkan' | 'Pune' | 'Nashik' | 'Chhatrapati Sambhajinagar' | 'Amravati' | 'Nagpur';
  latitude: number;
  longitude: number;
  talukas: Array<{ en: string; mr: string; hi: string }>;
}

export const MAHARASHTRA_DISTRICTS: MaharashtraDistrict[] = [
  {
    id: 'ahmednagar',
    nameEn: 'Ahmednagar (Ahilyanagar)',
    nameMr: 'अहिल्यानगर (अहमदनगर)',
    nameHi: 'अहिल्यानगर (अहमदनगर)',
    division: 'Nashik',
    latitude: 19.0948,
    longitude: 74.7480,
    talukas: [
      { en: 'Ahmednagar', mr: 'अहमदनगर', hi: 'अहमदनगर' },
      { en: 'Rahuri', mr: 'राहुरी', hi: 'राहुरी' },
      { en: 'Sangamner', mr: 'संगमनेर', hi: 'संगमनेर' },
      { en: 'Kopargaon', mr: 'कोपरगाव', hi: 'कोपरगांव' },
      { en: 'Shrirampur', mr: 'श्रीरामपूर', hi: 'श्रीरामपुर' },
      { en: 'Nevasa', mr: 'नेवासा', hi: 'नेवासा' },
      { en: 'Shevgaon', mr: 'शेवगाव', hi: 'शेवगांव' },
      { en: 'Pathardi', mr: 'पाथर्डी', hi: 'पाथर्डी' },
      { en: 'Parner', mr: 'पारनेर', hi: 'पारनेर' },
      { en: 'Karjat', mr: 'कर्जत', hi: 'कर्जत' },
      { en: 'Jamkhed', mr: 'जामखेड', hi: 'जामखेड' },
      { en: 'Akole', mr: 'अकोले', hi: 'अकोले' },
      { en: 'Shrigonda', mr: 'श्रीगोंदा', hi: 'श्रीगोंदा' },
      { en: 'Rahata', mr: 'राहाता', hi: 'राहाता' },
    ],
  },
  {
    id: 'akola',
    nameEn: 'Akola',
    nameMr: 'अकोला',
    nameHi: 'अकोला',
    division: 'Amravati',
    latitude: 20.7002,
    longitude: 77.0082,
    talukas: [
      { en: 'Akola', mr: 'अकोला', hi: 'अकोला' },
      { en: 'Akot', mr: 'आकोट', hi: 'आकोट' },
      { en: 'Telhara', mr: 'तेल्हारा', hi: 'तेल्हारा' },
      { en: 'Balapur', mr: 'बाळापूर', hi: 'बालापुर' },
      { en: 'Patur', mr: 'पातूर', hi: 'पातूर' },
      { en: 'Murtizapur', mr: 'मुर्तिजापूर', hi: 'मुर्तिजापुर' },
      { en: 'Barshitakli', mr: 'बार्शीटाकळी', hi: 'बार्शीटाकली' },
    ],
  },
  {
    id: 'amravati',
    nameEn: 'Amravati',
    nameMr: 'अमरावती',
    nameHi: 'अमरावती',
    division: 'Amravati',
    latitude: 20.9374,
    longitude: 77.7796,
    talukas: [
      { en: 'Amravati', mr: 'अमरावती', hi: 'अमरावती' },
      { en: 'Achalpur', mr: 'अचलपूर', hi: 'अचलपुर' },
      { en: 'Chandur Bazar', mr: 'चांदूर बाजार', hi: 'चांदुर बाजार' },
      { en: 'Morshi', mr: 'मोर्शी', hi: 'मोर्शी' },
      { en: 'Warud', mr: 'वरुड', hi: 'वरुड' },
      { en: 'Daryapur', mr: 'दर्यापूर', hi: 'दर्यापुर' },
      { en: 'Anjangaon Surji', mr: 'अंजनगाव सुर्जी', hi: 'अंजनगांव सुर्जी' },
      { en: 'Dhamangaon Railway', mr: 'धामणगाव रेल्वे', hi: 'धामनगांव' },
    ],
  },
  {
    id: 'chhatrapati_sambhajinagar',
    nameEn: 'Chhatrapati Sambhajinagar (Aurangabad)',
    nameMr: 'छत्रपती संभाजीनगर (औरंगाबाद)',
    nameHi: 'छत्रपति संभाजीनगर (औरंगाबाद)',
    division: 'Chhatrapati Sambhajinagar',
    latitude: 19.8762,
    longitude: 75.3433,
    talukas: [
      { en: 'Chhatrapati Sambhajinagar', mr: 'छत्रपती संभाजीनगर', hi: 'छत्रपति संभाजीनगर' },
      { en: 'Paithan', mr: 'पैठण', hi: 'पैठन' },
      { en: 'Vaijapur', mr: 'वैजापूर', hi: 'वैजापुर' },
      { en: 'Gangapur', mr: 'गंगापूर', hi: 'गंगापुर' },
      { en: 'Kannad', mr: 'कन्नड', hi: 'कन्नड' },
      { en: 'Khuldabad', mr: 'खुल्दाबाद', hi: 'खुल्दाबाद' },
      { en: 'Sillod', mr: 'सिल्लोड', hi: 'सिल्लोड' },
      { en: 'Soygaon', mr: 'सोयगाव', hi: 'सोयगांव' },
      { en: 'Phulambri', mr: 'फुलंब्री', hi: 'फुलंब्री' },
    ],
  },
  {
    id: 'beed',
    nameEn: 'Beed',
    nameMr: 'बीड',
    nameHi: 'बीड',
    division: 'Chhatrapati Sambhajinagar',
    latitude: 18.9891,
    longitude: 75.7601,
    talukas: [
      { en: 'Beed', mr: 'बीड', hi: 'बीड' },
      { en: 'Georai', mr: 'गेवराई', hi: 'गेवराई' },
      { en: 'Majalgaon', mr: 'माजलगाव', hi: 'माजलगांव' },
      { en: 'Ambejogai', mr: 'अंबाजोगाई', hi: 'अंबाजोगाई' },
      { en: 'Kaij', mr: 'केज', hi: 'केज' },
      { en: 'Parli Vaijnath', mr: 'परळी वैजनाथ', hi: 'परली वैजनाथ' },
      { en: 'Ashti', mr: 'आष्टी', hi: 'आष्टी' },
    ],
  },
  {
    id: 'bhandara',
    nameEn: 'Bhandara',
    nameMr: 'भंडारा',
    nameHi: 'भंडारा',
    division: 'Nagpur',
    latitude: 21.1458,
    longitude: 79.6534,
    talukas: [
      { en: 'Bhandara', mr: 'भंडारा', hi: 'भंडारा' },
      { en: 'Tumsar', mr: 'तुमसर', hi: 'तुमसर' },
      { en: 'Pauni', mr: 'पवनी', hi: 'पवनी' },
      { en: 'Mohadi', mr: 'मोहाडी', hi: 'मोहाडी' },
      { en: 'Sakoli', mr: 'साकोली', hi: 'साकोली' },
    ],
  },
  {
    id: 'buldhana',
    nameEn: 'Buldhana',
    nameMr: 'बुलढाणा',
    nameHi: 'बुलढाणा',
    division: 'Amravati',
    latitude: 20.5317,
    longitude: 76.1837,
    talukas: [
      { en: 'Buldhana', mr: 'बुलढाणा', hi: 'बुलढाणा' },
      { en: 'Chikhli', mr: 'चिखली', hi: 'चिखली' },
      { en: 'Deulgaon Raja', mr: 'देऊळगाव राजा', hi: 'देउलगांव राजा' },
      { en: 'Mehkar', mr: 'मेहकर', hi: 'मेहकर' },
      { en: 'Khamgaon', mr: 'खामगाव', hi: 'खामगांव' },
      { en: 'Shegaon', mr: 'शेगाव', hi: 'शेगांव' },
      { en: 'Malkapur', mr: 'मलकापूर', hi: 'मलकापुर' },
    ],
  },
  {
    id: 'chandrapur',
    nameEn: 'Chandrapur',
    nameMr: 'चंद्रपूर',
    nameHi: 'चंद्रपुर',
    division: 'Nagpur',
    latitude: 19.9615,
    longitude: 79.2961,
    talukas: [
      { en: 'Chandrapur', mr: 'चंद्रपूर', hi: 'चंद्रपुर' },
      { en: 'Warora', mr: 'वरोरा', hi: 'वरोरा' },
      { en: 'Bhadravati', mr: 'भद्रावती', hi: 'भद्रावती' },
      { en: 'Ballarpur', mr: 'बल्लारपूर', hi: 'बल्लारपुर' },
      { en: 'Rajura', mr: 'राजूरा', hi: 'राजूरा' },
    ],
  },
  {
    id: 'dhule',
    nameEn: 'Dhule',
    nameMr: 'धुळे',
    nameHi: 'धुले',
    division: 'Nashik',
    latitude: 20.9042,
    longitude: 74.7749,
    talukas: [
      { en: 'Dhule', mr: 'धुळे', hi: 'धुले' },
      { en: 'Sakri', mr: 'साक्री', hi: 'साक्री' },
      { en: 'Shirpur', mr: 'शिरपूर', hi: 'शिरपुर' },
      { en: 'Sindkheda', mr: 'शिंदखेडा', hi: 'शिंदखेडा' },
    ],
  },
  {
    id: 'gadchiroli',
    nameEn: 'Gadchiroli',
    nameMr: 'गडचिरोली',
    nameHi: 'गड़चिरोली',
    division: 'Nagpur',
    latitude: 20.1849,
    longitude: 80.0033,
    talukas: [
      { en: 'Gadchiroli', mr: 'गडचिरोली', hi: 'गड़चिरोली' },
      { en: 'Armori', mr: 'आरमोरी', hi: 'आरमोरी' },
      { en: 'Chamorshi', mr: 'चामोर्शी', hi: 'चामोर्शी' },
      { en: 'Aheri', mr: 'अहेरी', hi: 'अहेरी' },
    ],
  },
  {
    id: 'gondia',
    nameEn: 'Gondia',
    nameMr: 'गोंदिया',
    nameHi: 'गोंदिया',
    division: 'Nagpur',
    latitude: 21.4604,
    longitude: 80.1961,
    talukas: [
      { en: 'Gondia', mr: 'गोंदिया', hi: 'गोंदिया' },
      { en: 'Tirora', mr: 'तिरोरा', hi: 'तिरोरा' },
      { en: 'Goregaon', mr: 'गोरेगाव', hi: 'गोरेगांव' },
      { en: 'Amgaon', mr: 'आमगाव', hi: 'आमगांव' },
    ],
  },
  {
    id: 'hingoli',
    nameEn: 'Hingoli',
    nameMr: 'हिंगोली',
    nameHi: 'हिंगोली',
    division: 'Chhatrapati Sambhajinagar',
    latitude: 19.7196,
    longitude: 77.1485,
    talukas: [
      { en: 'Hingoli', mr: 'हिंगोली', hi: 'हिंगोली' },
      { en: 'Basmath', mr: 'वसमत', hi: 'वसमत' },
      { en: 'Kalamnuri', mr: 'कळमनुरी', hi: 'कलमनुरी' },
      { en: 'Sengon', mr: 'सेनगाव', hi: 'सेनगांव' },
      { en: 'Aundha Nagnath', mr: 'औंढा नागनाथ', hi: 'औंढा नागनाथ' },
    ],
  },
  {
    id: 'jalgaon',
    nameEn: 'Jalgaon',
    nameMr: 'जळगाव',
    nameHi: 'जलगांव',
    division: 'Nashik',
    latitude: 21.0077,
    longitude: 75.5626,
    talukas: [
      { en: 'Jalgaon', mr: 'जळगाव', hi: 'जलगांव' },
      { en: 'Bhusawal', mr: 'भुसावळ', hi: 'भुसावल' },
      { en: 'Raver', mr: 'रावेर', hi: 'रावेर' },
      { en: 'Yawal', mr: 'यावल', hi: 'यावल' },
      { en: 'Chopda', mr: 'चोपडा', hi: 'चोपड़ा' },
      { en: 'Pachora', mr: 'पाचोरा', hi: 'पाचोरा' },
      { en: 'Chalisgaon', mr: 'चाळीसगाव', hi: 'चालीसगांव' },
      { en: 'Jamner', mr: 'जामनेर', hi: 'जामनेर' },
      { en: 'Amalner', mr: 'अमळनेर', hi: 'अमलनेर' },
    ],
  },
  {
    id: 'jalna',
    nameEn: 'Jalna',
    nameMr: 'जालना',
    nameHi: 'जालना',
    division: 'Chhatrapati Sambhajinagar',
    latitude: 19.8410,
    longitude: 75.8864,
    talukas: [
      { en: 'Jalna', mr: 'जालना', hi: 'जालना' },
      { en: 'Ambad', mr: 'अंबड', hi: 'अंबड' },
      { en: 'Bhokardan', mr: 'भोकरदन', hi: 'भोकरदन' },
      { en: 'Partur', mr: 'परतूर', hi: 'परतूर' },
      { en: 'Ghansawangi', mr: 'घनसावंगी', hi: 'घनसावंगी' },
    ],
  },
  {
    id: 'kolhapur',
    nameEn: 'Kolhapur',
    nameMr: 'कोल्हापूर',
    nameHi: 'कोल्हापुर',
    division: 'Pune',
    latitude: 16.7050,
    longitude: 74.2433,
    talukas: [
      { en: 'Karveer', mr: 'करवीर (कोल्हापूर)', hi: 'करवीर (कोल्हापुर)' },
      { en: 'Hatkanangle', mr: 'हातकणंगले', hi: 'हातकणंगले' },
      { en: 'Shirol', mr: 'शिरोळ', hi: 'शिरोल' },
      { en: 'Panhala', mr: 'पन्हाळा', hi: 'पन्हाला' },
      { en: 'Shahuwadi', mr: 'शाहूवाडी', hi: 'शाहूवाडी' },
      { en: 'Radhanagari', mr: 'राधानगरी', hi: 'राधानगरी' },
      { en: 'Kagal', mr: 'कागल', hi: 'कागल' },
      { en: 'Gadhinglaj', mr: 'गडहिंग्लज', hi: 'गडहिंग्लज' },
    ],
  },
  {
    id: 'latur',
    nameEn: 'Latur',
    nameMr: 'लातूर',
    nameHi: 'लातुर',
    division: 'Chhatrapati Sambhajinagar',
    latitude: 18.4088,
    longitude: 76.5604,
    talukas: [
      { en: 'Latur', mr: 'लातूर', hi: 'लातुर' },
      { en: 'Ausa', mr: 'औसा', hi: 'औसा' },
      { en: 'Nilanga', mr: 'निलंगा', hi: 'निलंगा' },
      { en: 'Udgir', mr: 'उदगीर', hi: 'उदगीर' },
      { en: 'Chakur', mr: 'चाकूर', hi: 'चाकूर' },
      { en: 'Renapur', mr: 'रेणापूर', hi: 'रेणापुर' },
      { en: 'Ahmedpur', mr: 'अहमदपूर', hi: 'अहमदपुर' },
    ],
  },
  {
    id: 'mumbai_city',
    nameEn: 'Mumbai City',
    nameMr: 'मुंबई शहर',
    nameHi: 'मुंबई शहर',
    division: 'Konkan',
    latitude: 18.9388,
    longitude: 72.8354,
    talukas: [
      { en: 'Mumbai City', mr: 'मुंबई शहर', hi: 'मुंबई शहर' },
    ],
  },
  {
    id: 'mumbai_suburban',
    nameEn: 'Mumbai Suburban',
    nameMr: 'मुंबई उपनगर',
    nameHi: 'मुंबई उपनगर',
    division: 'Konkan',
    latitude: 19.0760,
    longitude: 72.8777,
    talukas: [
      { en: 'Andheri', mr: 'अंधेरी', hi: 'अंधेरी' },
      { en: 'Borivali', mr: 'बोरिवली', hi: 'बोरिवली' },
      { en: 'Kurla', mr: 'कुर्ला', hi: 'कुर्ला' },
    ],
  },
  {
    id: 'nagpur',
    nameEn: 'Nagpur',
    nameMr: 'नागपूर',
    nameHi: 'नागपुर',
    division: 'Nagpur',
    latitude: 21.1458,
    longitude: 79.0882,
    talukas: [
      { en: 'Nagpur Urban', mr: 'नागपूर शहर', hi: 'नागपुर शहर' },
      { en: 'Nagpur Rural', mr: 'नागपूर ग्रामीण', hi: 'नागपुर ग्रामीण' },
      { en: 'Kamptee', mr: 'कामठी', hi: 'कामठी' },
      { en: 'Hingna', mr: 'हिंगणा', hi: 'हिंगना' },
      { en: 'Katol', mr: 'काटोल', hi: 'काटोल' },
      { en: 'Narkhed', mr: 'नरखेड', hi: 'नरखेड' },
      { en: 'Saoner', mr: 'सावनेर', hi: 'सावनेर' },
      { en: 'Ramtek', mr: 'रामटेक', hi: 'रामटेक' },
      { en: 'Umred', mr: 'उमरेड', hi: 'उमरेड' },
    ],
  },
  {
    id: 'nanded',
    nameEn: 'Nanded',
    nameMr: 'नांदेड',
    nameHi: 'नांदेड',
    division: 'Chhatrapati Sambhajinagar',
    latitude: 19.1383,
    longitude: 77.3210,
    talukas: [
      { en: 'Nanded', mr: 'नांदेड', hi: 'नांदेड' },
      { en: 'Mudkhed', mr: 'मुदखेड', hi: 'मुदखेड' },
      { en: 'Ardhapur', mr: 'अर्धापूर', hi: 'अर्धापुर' },
      { en: 'Loha', mr: 'लोहा', hi: 'लोहा' },
      { en: 'Kandhar', mr: 'कंधार', hi: 'कंधार' },
      { en: 'Degloor', mr: 'देगलूर', hi: 'देगलूर' },
      { en: 'Mukhed', mr: 'मुखेड', hi: 'मुखेड' },
      { en: 'Kinwat', mr: 'किनवट', hi: 'किनवट' },
    ],
  },
  {
    id: 'nandurbar',
    nameEn: 'Nandurbar',
    nameMr: 'नंदुरबार',
    nameHi: 'नंदुरबार',
    division: 'Nashik',
    latitude: 21.3695,
    longitude: 74.2407,
    talukas: [
      { en: 'Nandurbar', mr: 'नंदुरबार', hi: 'नंदुरबार' },
      { en: 'Navapur', mr: 'नवापूर', hi: 'नवापुर' },
      { en: 'Shahada', mr: 'शहादा', hi: 'शहादा' },
      { en: 'Taloda', mr: 'तळोदा', hi: 'तलोदा' },
      { en: 'Akkalkuwa', mr: 'अक्कलकुवा', hi: 'अक्कलकुवा' },
      { en: 'Dhadgaon', mr: 'धडगाव', hi: 'धडगांव' },
    ],
  },
  {
    id: 'nashik',
    nameEn: 'Nashik',
    nameMr: 'नाशिक',
    nameHi: 'नासिक',
    division: 'Nashik',
    latitude: 19.9975,
    longitude: 73.7898,
    talukas: [
      { en: 'Nashik', mr: 'नाशिक', hi: 'नासिक' },
      { en: 'Niphad', mr: 'निफाड', hi: 'निफाड' },
      { en: 'Sinnar', mr: 'सिन्नर', hi: 'सिन्नर' },
      { en: 'Dindori', mr: 'दिंडोरी', hi: 'दिंडोरी' },
      { en: 'Igatpuri', mr: 'इगतपुरी', hi: 'इगतपुरी' },
      { en: 'Trimbakeshwar', mr: 'त्र्यंबकेश्वर', hi: 'त्र्यंबकेश्वर' },
      { en: 'Kalwan', mr: 'कळवण', hi: 'कलवण' },
      { en: 'Baglan (Satana)', mr: 'बागलाण (सटाणा)', hi: 'बागलाण (सटाणा)' },
      { en: 'Malegaon', mr: 'मालेगाव', hi: 'मालेगांव' },
      { en: 'Chandwad', mr: 'चांदवड', hi: 'चांदवड' },
      { en: 'Deola', mr: 'देवळा', hi: 'देवला' },
      { en: 'Yeola', mr: 'येवला', hi: 'येवला' },
      { en: 'Nandgaon', mr: 'नांदगाव', hi: 'नांदगांव' },
      { en: 'Surgana', mr: 'सुरगाणा', hi: 'सुरगाना' },
      { en: 'Peth', mr: 'पेठ', hi: 'पेठ' },
    ],
  },
  {
    id: 'dharashiv',
    nameEn: 'Dharashiv (Osmanabad)',
    nameMr: 'धाराशिव (उस्मानाबाद)',
    nameHi: 'धाराशिव (उस्मानाबाद)',
    division: 'Chhatrapati Sambhajinagar',
    latitude: 18.1853,
    longitude: 76.0423,
    talukas: [
      { en: 'Dharashiv', mr: 'धाराशिव', hi: 'धाराशिव' },
      { en: 'Tuljapur', mr: 'तुळजापूर', hi: 'तुलजापुर' },
      { en: 'Omerga', mr: 'उमरगा', hi: 'उमरगा' },
      { en: 'Lohara', mr: 'लोहारा', hi: 'लोहारा' },
      { en: 'Kalamb', mr: 'कळंब', hi: 'कलंब' },
      { en: 'Bhoom', mr: 'भूम', hi: 'भूम' },
      { en: 'Paranda', mr: 'परांडा', hi: 'परांडा' },
      { en: 'Washi', mr: 'वाशी', hi: 'वाशी' },
    ],
  },
  {
    id: 'palghar',
    nameEn: 'Palghar',
    nameMr: 'पालघर',
    nameHi: 'पालघर',
    division: 'Konkan',
    latitude: 19.6967,
    longitude: 72.7699,
    talukas: [
      { en: 'Palghar', mr: 'पालघर', hi: 'पालघर' },
      { en: 'Vasai', mr: 'वसई', hi: 'वसई' },
      { en: 'Dahanu', mr: 'डहाणू', hi: 'डहाणू' },
      { en: 'Talasari', mr: 'तलासरी', hi: 'तलासरी' },
      { en: 'Jawhar', mr: 'जव्हार', hi: 'जव्हार' },
      { en: 'Mokhada', mr: 'मोखाडा', hi: 'मोखाडा' },
      { en: 'Wada', mr: 'वाडा', hi: 'वाडा' },
      { en: 'Vikramgad', mr: 'विक्रमगड', hi: 'विक्रमगढ़' },
    ],
  },
  {
    id: 'parbhani',
    nameEn: 'Parbhani',
    nameMr: 'परभणी',
    nameHi: 'परभणी',
    division: 'Chhatrapati Sambhajinagar',
    latitude: 19.2644,
    longitude: 76.7767,
    talukas: [
      { en: 'Parbhani', mr: 'परभणी', hi: 'परभणी' },
      { en: 'Gangakhed', mr: 'गंगाखेड', hi: 'गंगाखेड' },
      { en: 'Pathri', mr: 'पाथरी', hi: 'पाथरी' },
      { en: 'Jintur', mr: 'जिंतूर', hi: 'जिंतूर' },
      { en: 'Manwath', mr: 'मानवत', hi: 'मानवत' },
      { en: 'Sailu', mr: 'सेलू', hi: 'सेलु' },
    ],
  },
  {
    id: 'pune',
    nameEn: 'Pune',
    nameMr: 'पुणे',
    nameHi: 'पुणे',
    division: 'Pune',
    latitude: 18.5204,
    longitude: 73.8567,
    talukas: [
      { en: 'Pune City', mr: 'पुणे शहर', hi: 'पुणे शहर' },
      { en: 'Haveli', mr: 'हवेली', hi: 'हवेली' },
      { en: 'Khed (Rajgurunagar)', mr: 'खेड (राजगुरुनगर)', hi: 'खेड (राजगुरुनगर)' },
      { en: 'Junnar', mr: 'जुन्नर', hi: 'जुन्नर' },
      { en: 'Ambegaon (Manchar)', mr: 'आंबेगाव (मंचर)', hi: 'आंबेगांव' },
      { en: 'Shirur (Ghodnadi)', mr: 'शिरूर', hi: 'शिरूर' },
      { en: 'Daund', mr: 'दौंड', hi: 'दौंड' },
      { en: 'Baramati', mr: 'बारामती', hi: 'बारामती' },
      { en: 'Indapur', mr: 'इंदापूर', hi: 'इंदापुर' },
      { en: 'Bhor', mr: 'भोर', hi: 'भोर' },
      { en: 'Purandar (Saswad)', mr: 'पुरंदर (सासवड)', hi: 'पुरंदर' },
      { en: 'Maval (Vadgaon)', mr: 'मावळ (वडगाव)', hi: 'मावल' },
      { en: 'Mulshi (Paud)', mr: 'मुळशी (पौड)', hi: 'मुलशी' },
      { en: 'Velhe', mr: 'वेल्हे', hi: 'वेल्हे' },
    ],
  },
  {
    id: 'raigad',
    nameEn: 'Raigad (Alibag)',
    nameMr: 'रायगड (अलिबाग)',
    nameHi: 'रायगढ़ (अलिबाग)',
    division: 'Konkan',
    latitude: 18.6414,
    longitude: 72.8722,
    talukas: [
      { en: 'Alibag', mr: 'अलिबाग', hi: 'अलिबाग' },
      { en: 'Pen', mr: 'पेण', hi: 'पेण' },
      { en: 'Panvel', mr: 'पनवेल', hi: 'पनवेल' },
      { en: 'Karjat', mr: 'कर्जत', hi: 'कर्जत' },
      { en: 'Khalapur', mr: 'खालापूर', hi: 'खालापुर' },
      { en: 'Roha', mr: 'रोहा', hi: 'रोहा' },
      { en: 'Mangaon', mr: 'माणगाव', hi: 'माणगांव' },
      { en: 'Mahad', mr: 'महाड', hi: 'महाड' },
    ],
  },
  {
    id: 'ratnagiri',
    nameEn: 'Ratnagiri',
    nameMr: 'रत्नागिरी',
    nameHi: 'रत्नागिरी',
    division: 'Konkan',
    latitude: 16.9902,
    longitude: 73.3120,
    talukas: [
      { en: 'Ratnagiri', mr: 'रत्नागिरी', hi: 'रत्नागिरी' },
      { en: 'Chiplun', mr: 'चिपळूण', hi: 'चिपळूण' },
      { en: 'Khed', mr: 'खेड', hi: 'खेड' },
      { en: 'Guhagar', mr: 'गुहागर', hi: 'गुहागर' },
      { en: 'Dapoli', mr: 'दापोली', hi: 'दापोली' },
      { en: 'Sangameshwar', mr: 'संगमेश्वर', hi: 'संगमेश्वर' },
      { en: 'Lanja', mr: 'लांजा', hi: 'लांजा' },
      { en: 'Rajapur', mr: 'राजापूर', hi: 'राजापुर' },
    ],
  },
  {
    id: 'sangli',
    nameEn: 'Sangli',
    nameMr: 'सांगली',
    nameHi: 'सांगली',
    division: 'Pune',
    latitude: 16.8524,
    longitude: 74.5815,
    talukas: [
      { en: 'Miraj (Sangli)', mr: 'मिरज (सांगली)', hi: 'मिरज (सांगली)' },
      { en: 'Walwa (Islampur)', mr: 'वाळवा (इस्लामपूर)', hi: 'वालवा (इस्लामपुर)' },
      { en: 'Tasgaon', mr: 'तासगाव', hi: 'तासगांव' },
      { en: 'Khanapur (Vita)', mr: 'खानापूर (विटा)', hi: 'खानापुर (विटा)' },
      { en: 'Atpadi', mr: 'आटपाडी', hi: 'आटपाडी' },
      { en: 'Jath', mr: 'जत', hi: 'जत' },
      { en: 'Shirala', mr: 'शिराळा', hi: 'शिराला' },
      { en: 'Kadegaon', mr: 'कडेगाव', hi: 'कडेगांव' },
      { en: 'Palus', mr: 'पलूस', hi: 'पलूस' },
    ],
  },
  {
    id: 'satara',
    nameEn: 'Satara',
    nameMr: 'सातारा',
    nameHi: 'सातारा',
    division: 'Pune',
    latitude: 17.6805,
    longitude: 73.9920,
    talukas: [
      { en: 'Satara', mr: 'सातारा', hi: 'सातारा' },
      { en: 'Karad', mr: 'कराड', hi: 'कराड' },
      { en: 'Wai', mr: 'वाई', hi: 'वाई' },
      { en: 'Khandala', mr: 'खंडाळा', hi: 'खंडाला' },
      { en: 'Phaltan', mr: 'फलटण', hi: 'फलटन' },
      { en: 'Koregaon', mr: 'कोरेगाव', hi: 'कोरेगांव' },
      { en: 'Khatav (Vaduj)', mr: 'खटाव (वडूज)', hi: 'खटाव' },
      { en: 'Maan (Dahiwadi)', mr: 'माण (दहीवडी)', hi: 'माण' },
      { en: 'Patan', mr: 'पाटण', hi: 'पाटन' },
      { en: 'Mahabaleshwar', mr: 'महाबळेश्वर', hi: 'महाबलेश्वर' },
    ],
  },
  {
    id: 'sindhudurg',
    nameEn: 'Sindhudurg (Oras)',
    nameMr: 'सिंधुदुर्ग (ओरोस)',
    nameHi: 'सिंधुदुर्ग (ओरोस)',
    division: 'Konkan',
    latitude: 16.1115,
    longitude: 73.6969,
    talukas: [
      { en: 'Kudal', mr: 'कुडाळ', hi: 'कुडाल' },
      { en: 'Kankavli', mr: 'कणकवली', hi: 'कणकवली' },
      { en: 'Sawantwadi', mr: 'सावंतवाडी', hi: 'सावंतवाडी' },
      { en: 'Malvan', mr: 'मालवण', hi: 'मालवण' },
      { en: 'Vengurla', mr: 'वेंगुर्ला', hi: 'वेंगुर्ला' },
      { en: 'Devgad', mr: 'देवगड', hi: 'देवगढ़' },
    ],
  },
  {
    id: 'solapur',
    nameEn: 'Solapur',
    nameMr: 'सोलापूर',
    nameHi: 'सोलापुर',
    division: 'Pune',
    latitude: 17.6599,
    longitude: 75.9064,
    talukas: [
      { en: 'North Solapur', mr: 'उत्तर सोलापूर', hi: 'उत्तर सोलापुर' },
      { en: 'South Solapur', mr: 'दक्षिण सोलापूर', hi: 'दक्षिण सोलापुर' },
      { en: 'Barshi', mr: 'बार्शी', hi: 'बार्शी' },
      { en: 'Pandharpur', mr: 'पंढरपूर', hi: 'पंढरपुर' },
      { en: 'Mohol', mr: 'मोहोळ', hi: 'मोहोळ' },
      { en: 'Madha (Kurduwadi)', mr: 'माढा (कुर्डुवाडी)', hi: 'माढा' },
      { en: 'Karmala', mr: 'करमाळा', hi: 'करमाला' },
      { en: 'Sangola', mr: 'सांगोला', hi: 'सांगोला' },
      { en: 'Malshiras (Akluj)', mr: 'माळशिरस (अकलूज)', hi: 'मालशिरस' },
      { en: 'Mangalwedha', mr: 'मंगळवेढा', hi: 'मंगलवेढा' },
      { en: 'Akkalkot', mr: 'अक्कलकोट', hi: 'अक्कलकोट' },
    ],
  },
  {
    id: 'thane',
    nameEn: 'Thane',
    nameMr: 'ठाणे',
    nameHi: 'ठाणे',
    division: 'Konkan',
    latitude: 19.2183,
    longitude: 72.9781,
    talukas: [
      { en: 'Thane', mr: 'ठाणे', hi: 'ठाणे' },
      { en: 'Kalyan', mr: 'कल्याण', hi: 'कल्याण' },
      { en: 'Bhiwandi', mr: 'भिवंडी', hi: 'भिवंडी' },
      { en: 'Ulhasnagar', mr: 'उल्हासनगर', hi: 'उल्हासनगर' },
      { en: 'Ambernath', mr: 'अंबरनाथ', hi: 'अंबरनाथ' },
      { en: 'Murbad', mr: 'मुरबाड', hi: 'मुरबाड' },
      { en: 'Shahapur', mr: 'शहापूर', hi: 'शहापुर' },
    ],
  },
  {
    id: 'wardha',
    nameEn: 'Wardha',
    nameMr: 'वर्धा',
    nameHi: 'वर्धा',
    division: 'Nagpur',
    latitude: 20.7453,
    longitude: 78.6022,
    talukas: [
      { en: 'Wardha', mr: 'वर्धा', hi: 'वर्धा' },
      { en: 'Hinganghat', mr: 'हिंगणघाट', hi: 'हिंगनघाट' },
      { en: 'Arvi', mr: 'आर्वी', hi: 'आर्वी' },
      { en: 'Deoli', mr: 'देवळी', hi: 'देवली' },
      { en: 'Seloo', mr: 'सेलू', hi: 'सेलू' },
    ],
  },
  {
    id: 'washim',
    nameEn: 'Washim',
    nameMr: 'वाशीम',
    nameHi: 'वाशिम',
    division: 'Amravati',
    latitude: 20.1110,
    longitude: 77.1342,
    talukas: [
      { en: 'Washim', mr: 'वाशीम', hi: 'वाशिम' },
      { en: 'Risod', mr: 'रिसोड', hi: 'रिसोड' },
      { en: 'Malegaon Jahangir', mr: 'मालेगाव जहांगीर', hi: 'मालेगांव' },
      { en: 'Mangrulpir', mr: 'मंगरुळपीर', hi: 'मंगरुलपीर' },
      { en: 'Karanja Lad', mr: 'कारंजा लाड', hi: 'कारंजा लाड' },
      { en: 'Manora', mr: 'मानोरा', hi: 'मानोरा' },
    ],
  },
  {
    id: 'yavatmal',
    nameEn: 'Yavatmal',
    nameMr: 'यवतमाळ',
    nameHi: 'यवतमाल',
    division: 'Amravati',
    latitude: 20.3888,
    longitude: 78.1204,
    talukas: [
      { en: 'Yavatmal', mr: 'यवतमाळ', hi: 'यवतमाल' },
      { en: 'Pusad', mr: 'पुसद', hi: 'पुसद' },
      { en: 'Umarkhed', mr: 'उमरखेड', hi: 'उमरखेड' },
      { en: 'Digras', mr: 'दिग्रस', hi: 'दिग्रस' },
      { en: 'Darwha', mr: 'दारव्हा', hi: 'दारव्हा' },
      { en: 'Wani', mr: 'वणी', hi: 'वणी' },
      { en: 'Pandharkawada (Kelapur)', mr: 'पांढरकवडा (केळापूर)', hi: 'पांढरकवडा' },
      { en: 'Arni', mr: 'आर्णी', hi: 'आर्णी' },
      { en: 'Ralegaon', mr: 'राळेगाव', hi: 'रालेगांव' },
      { en: 'Ghatanji', mr: 'घाटंजी', hi: 'घाटंजी' },
    ],
  },
];

/**
 * Calculates geographical distance in kilometers between two GPS coordinates using the Haversine formula
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Find the closest Maharashtra district to given coordinates
 */
export function findNearestMaharashtraDistrict(lat: number, lon: number): MaharashtraDistrict {
  let closest = MAHARASHTRA_DISTRICTS[0];
  let minDistance = Infinity;

  for (const d of MAHARASHTRA_DISTRICTS) {
    const dist = calculateHaversineDistanceKm(lat, lon, d.latitude, d.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = d;
    }
  }

  return closest;
}

/**
 * Searches across all Maharashtra districts, talukas, and major settlements
 */
export function searchMaharashtraLocations(query: string, lang: 'en' | 'mr' | 'hi' = 'mr') {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();

  const results: Array<{
    type: 'DISTRICT' | 'TALUKA' | 'VILLAGE';
    districtId: string;
    districtName: string;
    talukaName?: string;
    placeName: string;
    latitude: number;
    longitude: number;
  }> = [];

  for (const d of MAHARASHTRA_DISTRICTS) {
    const dNameEn = d.nameEn.toLowerCase();
    const dNameMr = d.nameMr.toLowerCase();
    const dNameHi = d.nameHi.toLowerCase();
    const primaryName = lang === 'mr' ? d.nameMr : lang === 'hi' ? d.nameHi : d.nameEn;

    if (dNameEn.includes(q) || dNameMr.includes(q) || dNameHi.includes(q)) {
      results.push({
        type: 'DISTRICT',
        districtId: d.id,
        districtName: primaryName,
        placeName: primaryName,
        latitude: d.latitude,
        longitude: d.longitude,
      });
    }

    for (const t of d.talukas) {
      const tEn = t.en.toLowerCase();
      const tMr = t.mr.toLowerCase();
      const tHi = t.hi.toLowerCase();
      const talukaName = lang === 'mr' ? t.mr : lang === 'hi' ? t.hi : t.en;

      if (tEn.includes(q) || tMr.includes(q) || tHi.includes(q)) {
        results.push({
          type: 'TALUKA',
          districtId: d.id,
          districtName: primaryName,
          talukaName,
          placeName: `${talukaName}, ${primaryName}`,
          latitude: d.latitude + (Math.sin(t.en.length) * 0.05),
          longitude: d.longitude + (Math.cos(t.en.length) * 0.05),
        });
      }
    }
  }

  return results.slice(0, 10);
}
