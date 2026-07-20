import React, { createContext, useState, useEffect, useContext } from 'react';

export const CountryContext = createContext({
  country: 'IN',
  setCountry: () => {},
  countryFlag: '🇮🇳',
  countryName: 'India',
  operatorLabel: 'Indian Railways',
  isIndonesia: false,
  isIndia: true,
});

export const CountryProvider = ({ children }) => {
  const [country, setCountryState] = useState(() => {
    return localStorage.getItem('wakeMyStop_country') || 'IN';
  });

  const setCountry = (newCountry) => {
    setCountryState(newCountry);
    localStorage.setItem('wakeMyStop_country', newCountry);
  };

  const isIndonesia = country === 'ID';
  const isIndia = country === 'IN';
  const countryFlag = isIndonesia ? '🇮🇩' : '🇮🇳';
  const countryName = isIndonesia ? 'Indonesia' : 'India';
  const operatorLabel = isIndonesia ? 'PT KAI' : 'Indian Railways';

  return (
    <CountryContext.Provider
      value={{
        country,
        setCountry,
        countryFlag,
        countryName,
        operatorLabel,
        isIndonesia,
        isIndia,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => useContext(CountryContext);
