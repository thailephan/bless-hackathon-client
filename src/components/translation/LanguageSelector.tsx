import type { Language, LanguageCode } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSelectorProps {
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
  languages: readonly Language[];
  disabled?: boolean;
}

export function LanguageSelector({ value, onChange, languages, disabled }: LanguageSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full sm:w-[150px] md:w-[180px] text-xs sm:text-sm rounded-md shadow-sm h-9 md:h-10">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.value} value={lang.value} className="text-xs sm:text-sm">
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
