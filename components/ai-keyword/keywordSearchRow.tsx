'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Globe2Icon, SearchIcon, SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type KeywordSearchValues = {
  keyword: string;
  language: string;
  country: string;
  countryName: string;
};

type KeywordSearchRowProps = {
  isSearching: boolean;
  onSearch: (values: KeywordSearchValues) => void | Promise<void>;
  remaining?: number;
  isPaid?: boolean;
};

const languageOptions = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  nl: 'Dutch',
  ja: 'Japanese',
};

const countryCodes =
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(
    ' ',
  );

const countryNameFormatter = new Intl.DisplayNames(['en'], { type: 'region' });

const countryOptions = countryCodes
  .map((code) => ({
    code,
    name: countryNameFormatter.of(code) ?? code,
  }))
  .sort((first, second) => first.name.localeCompare(second.name));

const countryItems = Object.fromEntries(
  countryOptions.map((country) => [country.code, country.name]),
);

function CountryFlag({ code }: { code: string }) {
  return (
    <Image
      src={`https://flagsapi.com/${code}/flat/64.png`}
      alt=''
      width={20}
      height={15}
      className='h-3.5 w-5 shrink-0 rounded-xs object-cover'
    />
  );
}

export function KeywordSearchRow({
  isSearching,
  onSearch,
  remaining,
  isPaid = false,
}: KeywordSearchRowProps) {
  const [keyword, setKeyword] = useState('');
  const usageExhausted = remaining === 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSearching || usageExhausted || keyword.trim().length < 2) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const country = String(formData.get('country'));

    void onSearch({
      keyword: keyword.trim(),
      language: String(formData.get('language')),
      country,
      countryName:
        countryOptions.find((option) => option.code === country)?.name ??
        country,
    });
  };

  return (
    <div className='space-y-3'>
      <form
        onSubmit={handleSubmit}
        className='grid gap-3 rounded-xl bg-primary/5 p-3 lg:grid-cols-[minmax(16rem,1fr)_11rem_15rem_auto] lg:items-end'
      >
        <div className='flex min-w-0 flex-col gap-1.5'>
          <label htmlFor='keyword' className='text-xs font-semibold'>
            Enter a keyword
          </label>
          <InputGroup className='h-9 rounded-lg border border-input bg-background px-3 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              id='keyword'
              name='keyword'
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              disabled={isSearching}
              placeholder='Try “generative engine optimization”'
              autoComplete='off'
            />
          </InputGroup>

          <div className='flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-muted-foreground'>
            <span className='font-medium text-muted-foreground'>✨ AEO/GEO Presets:</span>
            <button
              type='button'
              onClick={() => setKeyword('generative engine optimization')}
              className='rounded-md border border-border bg-muted/60 px-2 py-0.5 font-medium text-foreground transition-colors hover:bg-accent'
            >
              Generative Engine Optimization
            </button>
            <button
              type='button'
              onClick={() => setKeyword('answer engine optimization')}
              className='rounded-md border border-border bg-muted/60 px-2 py-0.5 font-medium text-foreground transition-colors hover:bg-accent'
            >
              Answer Engine Optimization
            </button>
            <button
              type='button'
              onClick={() => setKeyword('chatgpt search citations')}
              className='rounded-md border border-border bg-muted/60 px-2 py-0.5 font-medium text-foreground transition-colors hover:bg-accent'
            >
              ChatGPT Search Citations
            </button>
            <button
              type='button'
              onClick={() => setKeyword('llms.txt standard')}
              className='rounded-md border border-border bg-muted/60 px-2 py-0.5 font-medium text-foreground transition-colors hover:bg-accent'
            >
              llms.txt Standard
            </button>
          </div>
        </div>

        <div className='flex min-w-0 flex-col gap-1.5'>
          <label htmlFor='language' className='text-xs font-semibold'>
            Language
          </label>
          <Select
            defaultValue='en'
            items={languageOptions}
            name='language'
            disabled={isSearching || usageExhausted}
          >
            <SelectTrigger
              id='language'
              size='sm'
              className='h-9 w-full rounded-lg border border-input bg-background px-3 shadow-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20'
            >
              <Globe2Icon />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.entries(languageOptions).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className='flex min-w-0 flex-col gap-1.5'>
          <label htmlFor='country' className='text-xs font-semibold'>
            Location
          </label>
          <Select
            defaultValue='US'
            items={countryItems}
            name='country'
            disabled={isSearching || usageExhausted}
          >
            <SelectTrigger
              id='country'
              size='sm'
              className='h-9 w-full rounded-lg border border-input bg-background px-3 shadow-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20'
            >
              <SelectValue>
                {(countryCode: string | null) => {
                  const selectedCountry = countryOptions.find(
                    (country) => country.code === countryCode,
                  );

                  return selectedCountry ? (
                    <>
                      <CountryFlag code={selectedCountry.code} />
                      <span>{selectedCountry.name}</span>
                    </>
                  ) : (
                    'Select country'
                  );
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className='max-h-80'>
              <SelectGroup>
                {countryOptions.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <CountryFlag code={country.code} />
                    <span>{country.name}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Button
          type='submit'
          size='sm'
          disabled={isSearching || keyword.trim().length < 2}
          className='h-9 w-full self-end bg-gradient-to-r from-primary to-primary/80 text-xs tracking-tight shadow-sm lg:w-auto'
        >
          <SparklesIcon
            data-icon='inline-start'
            className={isSearching ? 'animate-spin' : undefined}
          />
          {isSearching ? 'Researching…' : 'AI Search'}
        </Button>
      </form>

      <div className='flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-muted-foreground'>
        <SparklesIcon className='size-3.5 text-primary' aria-hidden='true' />
        <span className='font-medium text-primary'>
          BrandRadar Community Edition · Unlimited Keyword Research & AEO Citations
        </span>
      </div>
    </div>
  );
}
