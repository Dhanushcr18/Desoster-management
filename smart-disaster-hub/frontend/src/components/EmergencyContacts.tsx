import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Globe, X, Search } from 'lucide-react';

interface EmergencyContact {
  country: string;
  countryCode: string;
  flag: string;
  police: string;
  fire: string;
  ambulance: string;
  disasterManagement: string;
  email: string;
  website?: string;
}

const emergencyContacts: EmergencyContact[] = [
  {
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    police: '100',
    fire: '101',
    ambulance: '102',
    disasterManagement: '1078',
    email: 'disaster@ndma.gov.in',
    website: 'https://ndma.gov.in'
  },
  {
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    police: '911',
    fire: '911',
    ambulance: '911',
    disasterManagement: '1-800-621-3362',
    email: 'fema@dhs.gov',
    website: 'https://www.fema.gov'
  },
  {
    country: 'United Kingdom',
    countryCode: 'GB',
    flag: '🇬🇧',
    police: '999',
    fire: '999',
    ambulance: '999',
    disasterManagement: '0800-107-0059',
    email: 'enquiries@cabinetoffice.gov.uk',
    website: 'https://www.gov.uk/guidance/preparation-and-planning-for-emergencies'
  },
  {
    country: 'Canada',
    countryCode: 'CA',
    flag: '🇨🇦',
    police: '911',
    fire: '911',
    ambulance: '911',
    disasterManagement: '1-800-622-6232',
    email: 'ps.nccema-maoccu.sp@canada.ca',
    website: 'https://www.publicsafety.gc.ca'
  },
  {
    country: 'Australia',
    countryCode: 'AU',
    flag: '🇦🇺',
    police: '000',
    fire: '000',
    ambulance: '000',
    disasterManagement: '132-500',
    email: 'info@homeaffairs.gov.au',
    website: 'https://www.homeaffairs.gov.au'
  },
  {
    country: 'Japan',
    countryCode: 'JP',
    flag: '🇯🇵',
    police: '110',
    fire: '119',
    ambulance: '119',
    disasterManagement: '03-3501-5408',
    email: 'info@fdma.go.jp',
    website: 'https://www.fdma.go.jp'
  },
  {
    country: 'Germany',
    countryCode: 'DE',
    flag: '🇩🇪',
    police: '110',
    fire: '112',
    ambulance: '112',
    disasterManagement: '115',
    email: 'poststelle@bmi.bund.de',
    website: 'https://www.bbk.bund.de'
  },
  {
    country: 'France',
    countryCode: 'FR',
    flag: '🇫🇷',
    police: '17',
    fire: '18',
    ambulance: '15',
    disasterManagement: '112',
    email: 'contact@interieur.gouv.fr',
    website: 'https://www.interieur.gouv.fr'
  },
  {
    country: 'China',
    countryCode: 'CN',
    flag: '🇨🇳',
    police: '110',
    fire: '119',
    ambulance: '120',
    disasterManagement: '12121',
    email: 'webmaster@mem.gov.cn',
    website: 'https://www.mem.gov.cn'
  },
  {
    country: 'Brazil',
    countryCode: 'BR',
    flag: '🇧🇷',
    police: '190',
    fire: '193',
    ambulance: '192',
    disasterManagement: '199',
    email: 'defesacivil@mdr.gov.br',
    website: 'https://www.gov.br/mdr'
  },
  {
    country: 'South Africa',
    countryCode: 'ZA',
    flag: '🇿🇦',
    police: '10111',
    fire: '10177',
    ambulance: '10177',
    disasterManagement: '0860-142-142',
    email: 'media@dpme.gov.za',
    website: 'https://www.gov.za'
  },
  {
    country: 'Mexico',
    countryCode: 'MX',
    flag: '🇲🇽',
    police: '911',
    fire: '911',
    ambulance: '911',
    disasterManagement: '911',
    email: 'contacto@gob.mx',
    website: 'https://www.gob.mx'
  },
  {
    country: 'Russia',
    countryCode: 'RU',
    flag: '🇷🇺',
    police: '102',
    fire: '101',
    ambulance: '103',
    disasterManagement: '112',
    email: 'info@mchs.gov.ru',
    website: 'https://www.mchs.gov.ru'
  },
  {
    country: 'Italy',
    countryCode: 'IT',
    flag: '🇮🇹',
    police: '113',
    fire: '115',
    ambulance: '118',
    disasterManagement: '112',
    email: 'protezionecivile@governo.it',
    website: 'https://www.protezionecivile.gov.it'
  },
  {
    country: 'Spain',
    countryCode: 'ES',
    flag: '🇪🇸',
    police: '112',
    fire: '112',
    ambulance: '112',
    disasterManagement: '112',
    email: 'dgpce@interior.es',
    website: 'https://www.interior.gob.es'
  },
  {
    country: 'South Korea',
    countryCode: 'KR',
    flag: '🇰🇷',
    police: '112',
    fire: '119',
    ambulance: '119',
    disasterManagement: '119',
    email: 'webmaster@mois.go.kr',
    website: 'https://www.mois.go.kr'
  },
  {
    country: 'Singapore',
    countryCode: 'SG',
    flag: '🇸🇬',
    police: '999',
    fire: '995',
    ambulance: '995',
    disasterManagement: '1800-286-6666',
    email: 'mha_feedback@mha.gov.sg',
    website: 'https://www.scdf.gov.sg'
  },
  {
    country: 'New Zealand',
    countryCode: 'NZ',
    flag: '🇳🇿',
    police: '111',
    fire: '111',
    ambulance: '111',
    disasterManagement: '0800-002-222',
    email: 'info@civildefence.govt.nz',
    website: 'https://www.civildefence.govt.nz'
  },
  {
    country: 'UAE',
    countryCode: 'AE',
    flag: '🇦🇪',
    police: '999',
    fire: '997',
    ambulance: '998',
    disasterManagement: '999',
    email: 'ncema@ncema.gov.ae',
    website: 'https://www.ncema.gov.ae'
  },
  {
    country: 'Saudi Arabia',
    countryCode: 'SA',
    flag: '🇸🇦',
    police: '999',
    fire: '998',
    ambulance: '997',
    disasterManagement: '911',
    email: 'info@998.gov.sa',
    website: 'https://www.998.gov.sa'
  }
];

interface EmergencyContactsProps {
  onClose: () => void;
}

export default function EmergencyContacts({ onClose }: EmergencyContactsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState(emergencyContacts);
  const [userCountry, setUserCountry] = useState<string>('');

  useEffect(() => {
    // Try to detect user's country
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        setUserCountry(data.country_name || '');
      })
      .catch(() => {
        // If detection fails, default to showing all
      });
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContacts(emergencyContacts);
    } else {
      const filtered = emergencyContacts.filter(contact =>
        contact.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.countryCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchTerm]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9998 }}>
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Phone className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Emergency Contacts</h2>
                <p className="text-sm text-white/90">Worldwide disaster management hotlines</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search country..."
              className="w-full pl-12 pr-4 py-3 bg-white/20 border-2 border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/60"
            />
          </div>
        </div>

        {/* User's Country Highlight */}
        {userCountry && (
          <div className="bg-blue-50 border-b-2 border-blue-200 p-4">
            <p className="text-sm text-blue-800 font-medium flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>You appear to be in <strong>{userCountry}</strong> - Showing your local emergency numbers first</span>
            </p>
          </div>
        )}

        {/* Contacts Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts
              .sort((a, b) => {
                // Put user's country first
                if (a.country === userCountry) return -1;
                if (b.country === userCountry) return 1;
                return a.country.localeCompare(b.country);
              })
              .map((contact) => (
                <div
                  key={contact.countryCode}
                  className={`border-2 rounded-xl p-4 transition-all duration-300 hover:shadow-xl ${
                    contact.country === userCountry
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-red-500'
                  }`}
                >
                  {/* Country Header */}
                  <div className="flex items-center space-x-3 mb-4 pb-3 border-b-2 border-gray-200">
                    <span className="text-4xl">{contact.flag}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{contact.country}</h3>
                      <p className="text-xs text-gray-500">{contact.countryCode}</p>
                    </div>
                    {contact.country === userCountry && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                        YOUR LOCATION
                      </span>
                    )}
                  </div>

                  {/* Emergency Numbers */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">🚓 Police</span>
                      <a
                        href={`tel:${contact.police}`}
                        className="font-bold text-blue-600 hover:text-blue-800 text-lg"
                      >
                        {contact.police}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">🚒 Fire</span>
                      <a
                        href={`tel:${contact.fire}`}
                        className="font-bold text-red-600 hover:text-red-800 text-lg"
                      >
                        {contact.fire}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">🚑 Ambulance</span>
                      <a
                        href={`tel:${contact.ambulance}`}
                        className="font-bold text-green-600 hover:text-green-800 text-lg"
                      >
                        {contact.ambulance}
                      </a>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600 font-semibold">⚠️ Disaster</span>
                      <a
                        href={`tel:${contact.disasterManagement}`}
                        className="font-bold text-orange-600 hover:text-orange-800 text-lg"
                      >
                        {contact.disasterManagement}
                      </a>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 pt-3 border-t-2 border-gray-200 space-y-2">
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center space-x-2 text-xs text-gray-600 hover:text-blue-600 transition"
                    >
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{contact.email}</span>
                    </a>
                    {contact.website && (
                      <a
                        href={contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-xs text-gray-600 hover:text-blue-600 transition"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="truncate">Official Website</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {filteredContacts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No countries found matching "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t-2 border-gray-200 p-4">
          <div className="flex items-start space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <Phone className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 font-medium">
                <strong>Important:</strong> In case of emergency, always dial your local emergency number immediately.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                These contacts are for disaster management coordination. For immediate life-threatening situations, use your country's primary emergency number.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
