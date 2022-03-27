import React, {
  ReactText,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  SetStateAction,
} from "react";
import { toast } from "react-toastify";
import {
  countries,
  getCountryName,
  sanitizeCountryName,
} from "../domain/countries";
import { CountryInput } from "./CountryInput";
import * as geolib from "geolib";
import { Share } from "./Share";
import { Guesses } from "./Guesses";
import { useTranslation } from "react-i18next";
import { SettingsData } from "../hooks/useSettings";
import { ModifierMode } from "../hooks/useMode";
import { useCountries } from "../hooks/useCountries";
import { Twemoji } from "@teuteuf/react-emoji-render";

interface GameProps {
  settingsData: SettingsData;
  updateSettings: (newSettings: Partial<SettingsData>) => void;
  hideImageMode: ModifierMode;
  setHideImageMode: (newHideImageMode: SetStateAction<ModifierMode>) => void;
  rotationMode: ModifierMode;
  setRotationMode: (newRotationMode: SetStateAction<ModifierMode>) => void;
}

export function Game({
  settingsData,
  updateSettings,
  hideImageMode,
  setHideImageMode,
  rotationMode,
  setRotationMode,
}: GameProps) {
  const { t, i18n } = useTranslation();

  const countryInputRef = useRef<HTMLInputElement>(null);

  const [todays, addGuess] = useCountries();
  const { country, guesses, randomAngle, imageScale } = todays;

  const [currentGuess, setCurrentGuess] = useState("");

  // TODO make this when you give up
  const gameEnded = guesses[guesses.length - 1]?.distance === 0;

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      if (country == null) {
        return;
      }
      e.preventDefault();
      const guessedCountry = countries.find(
        (country) =>
          sanitizeCountryName(
            getCountryName(i18n.resolvedLanguage, country)
          ) === sanitizeCountryName(currentGuess)
      );

      if (guessedCountry == null) {
        toast.error(t("unknownCountry"));
        return;
      }

      const newGuess = {
        name: currentGuess,
        distance: geolib.getDistance(guessedCountry, country),
        direction: geolib.getCompassDirection(
          guessedCountry,
          country,
          (origin, dest) =>
            Math.round(geolib.getRhumbLineBearing(origin, dest) / 45) * 45
        ),
      };

      addGuess(newGuess);
      setCurrentGuess("");

      // Reset mode temp disabled
      if (newGuess.distance == 0) {
        setRotationMode((prev) => ({
          enabled: prev.enabled,
          tempDisabled: false,
        }));
        setHideImageMode((prev) => ({
          enabled: prev.enabled,
          tempDisabled: false,
        }));
      }
    },
    [
      addGuess,
      country,
      currentGuess,
      i18n.resolvedLanguage,
      t,
      setRotationMode,
      setHideImageMode,
    ]
  );

  // TODO add guess for give up that is the current country

  return (
    <div className="flex-grow flex flex-col mx-2">
      {hideImageMode.enabled && !hideImageMode.tempDisabled && !gameEnded && (
        <button
          className="border-2 uppercase my-2 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-slate-800 dark:active:bg-slate-700"
          type="button"
          onClick={() =>
            setHideImageMode((prev) => ({
              enabled: prev.enabled,
              tempDisabled: true,
            }))
          }
        >
          <Twemoji
            text={t("showCountry")}
            options={{ className: "inline-block" }}
          />
        </button>
      )}
      <div className="flex my-1">
        <img
          className={`pointer-events-none max-h-52 m-auto transition-transform duration-700 ease-in dark:invert ${
            hideImageMode.enabled && !hideImageMode.tempDisabled && !gameEnded
              ? "h-0"
              : "h-full"
          }`}
          alt="country to guess"
          src={`images/countries/${country?.code.toLowerCase()}/vector.svg`}
          style={
            rotationMode.enabled && !rotationMode.tempDisabled && !gameEnded
              ? {
                  transform: `rotate(${randomAngle}deg) scale(${imageScale})`,
                }
              : {}
          }
        />
      </div>
      {rotationMode.enabled &&
        !rotationMode.tempDisabled &&
        (!hideImageMode.enabled ||
          (hideImageMode.enabled && hideImageMode.tempDisabled)) &&
        !gameEnded && (
          <button
            className="border-2 uppercase mb-2 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-slate-800 dark:active:bg-slate-700"
            type="button"
            onClick={() =>
              setRotationMode((prev) => ({
                enabled: prev.enabled,
                tempDisabled: true,
              }))
            }
          >
            <Twemoji
              text={t("cancelRotation")}
              options={{ className: "inline-block" }}
            />
          </button>
        )}
      <Guesses
        rowCount={guesses.length}
        guesses={guesses}
        settingsData={settingsData}
        countryInputRef={countryInputRef}
      />
      <div className="my-2">
        {gameEnded && country ? (
          <>
            <a
              className="underline w-full text-center block mt-4"
              href={`https://www.google.com/maps?q=${getCountryName(
                i18n.resolvedLanguage,
                country
              )}+${country.code.toUpperCase()}&hl=${i18n.resolvedLanguage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twemoji
                text={t("showOnGoogleMaps")}
                options={{ className: "inline-block" }}
              />
            </a>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <CountryInput
                inputRef={countryInputRef}
                currentGuess={currentGuess}
                setCurrentGuess={setCurrentGuess}
              />
              <button
                className="rounded font-bold p-1 flex items-center justify-center border-2 uppercase my-0.5 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-slate-800 dark:active:bg-slate-700"
                type="submit"
              >
                <Twemoji
                  text="🌍"
                  options={{ className: "inline-block" }}
                  className="flex items-center justify-center"
                />{" "}
                <span className="ml-1">{t("guess")}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
