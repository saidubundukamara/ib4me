"use client";

import React from "react";
import { Check, ChevronsUpDown, Building2, Loader2, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface Hospital {
  _id: string;
  name: string;
  address?: string | null;
}

export interface HospitalValue {
  hospitalId?: string;
  name: string;
}

interface HospitalComboboxProps {
  value: HospitalValue;
  onChange: (value: HospitalValue) => void;
  disabled?: boolean;
  className?: string;
}

export default function HospitalCombobox({
  value,
  onChange,
  disabled = false,
  className,
}: HospitalComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [hospitals, setHospitals] = React.useState<Hospital[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = React.useState(!value.hospitalId && !!value.name);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch hospitals on mount
  React.useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/hospitals");
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setHospitals(data.data);
          }
        } else {
          setError("Failed to load hospitals");
        }
      } catch (err) {
        console.error("Error fetching hospitals:", err);
        setError("Failed to load hospitals");
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  // Determine if current value is a custom entry
  React.useEffect(() => {
    if (value.hospitalId) {
      setIsCustomMode(false);
    } else if (value.name && !value.hospitalId && hospitals.length > 0) {
      // Check if name matches any hospital
      const matchingHospital = hospitals.find(
        (h) => h.name.toLowerCase() === value.name.toLowerCase()
      );
      if (matchingHospital) {
        onChange({ hospitalId: matchingHospital._id, name: matchingHospital.name });
        setIsCustomMode(false);
      } else if (value.name) {
        setIsCustomMode(true);
      }
    }
  }, [value.hospitalId, value.name, hospitals, onChange]);

  // Filter hospitals based on search query
  const filteredHospitals = React.useMemo(() => {
    if (!searchQuery.trim()) return hospitals;
    const query = searchQuery.toLowerCase();
    return hospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(query) ||
        (h.address && h.address.toLowerCase().includes(query))
    );
  }, [hospitals, searchQuery]);

  const handleSelectHospital = (hospital: Hospital) => {
    onChange({ hospitalId: hospital._id, name: hospital.name });
    setIsCustomMode(false);
    setOpen(false);
    setSearchQuery("");
  };

  const handleUseCustom = () => {
    const name = searchQuery.trim();
    onChange({ hospitalId: undefined, name });
    setIsCustomMode(true);
    setOpen(false);
    setSearchQuery("");
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    onChange({ hospitalId: undefined, name });
  };

  const handleSwitchToSelect = () => {
    setIsCustomMode(false);
    setOpen(true);
  };

  // Get display value
  const displayValue = React.useMemo(() => {
    if (value.hospitalId) {
      const hospital = hospitals.find((h) => h._id === value.hospitalId);
      return hospital?.name || value.name || "";
    }
    return value.name || "";
  }, [value, hospitals]);

  // Custom input mode
  if (isCustomMode) {
    return (
      <div className={cn("flex gap-2", className)}>
        <Input
          value={value.name}
          onChange={handleCustomInputChange}
          placeholder="Enter hospital name"
          disabled={disabled}
          className="rounded-2xl flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleSwitchToSelect}
          disabled={disabled}
          className="rounded-2xl shrink-0"
          title="Select from list"
        >
          <Building2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between rounded-2xl font-normal h-10",
            !displayValue && "text-muted-foreground",
            className
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading hospitals...
            </span>
          ) : displayValue ? (
            <span className="truncate">{displayValue}</span>
          ) : (
            "Select hospital..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search hospitals..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {error ? (
              <CommandEmpty className="py-4 text-center text-sm text-destructive">
                {error}. You can enter a custom name below.
              </CommandEmpty>
            ) : loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredHospitals.length === 0 && searchQuery ? (
              <CommandEmpty>
                No hospitals found.
                <p className="mt-1 text-xs text-muted-foreground">
                  Click below to use &ldquo;{searchQuery}&rdquo; as custom name.
                </p>
              </CommandEmpty>
            ) : filteredHospitals.length === 0 ? (
              <CommandEmpty>
                No hospitals available.
              </CommandEmpty>
            ) : (
              <CommandGroup heading="Verified Hospitals">
                {filteredHospitals.map((hospital) => (
                  <CommandItem
                    key={hospital._id}
                    value={hospital._id}
                    onSelect={() => handleSelectHospital(hospital)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value.hospitalId === hospital._id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{hospital.name}</p>
                      {hospital.address && (
                        <p className="text-xs text-muted-foreground truncate">
                          {hospital.address}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={handleUseCustom}
                className="flex items-center gap-2"
              >
                <PenLine className="h-4 w-4" />
                <span>
                  {searchQuery
                    ? `Use "${searchQuery}" as custom name`
                    : "Enter a different hospital name"}
                </span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
