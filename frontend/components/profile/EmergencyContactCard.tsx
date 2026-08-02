import React from "react";
import Link from "next/link";
import { Phone, ShieldAlert, Edit, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface EmergencyContactCardProps {
  name?: string;
  phone?: string;
}

export const EmergencyContactCard: React.FC<EmergencyContactCardProps> = ({ name, phone }) => {
  const hasContact = name && phone;

  return (
    <Card className="border-2 border-[#0F6E7A]/25 bg-gradient-to-r from-[#E6F4F3]/90 via-[#F7FAFA] to-white shadow-sm p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#0F6E7A] text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F6E7A] bg-white px-2.5 py-0.5 rounded-full border border-[#0F6E7A]/20">
                Primary Emergency Contact
              </span>
            </div>

            {hasContact ? (
              <>
                <h3 className="font-heading font-bold text-base text-[#1E2A2E] mt-0.5">
                  {name}
                </h3>
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#0F6E7A] hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{phone}</span>
                </a>
              </>
            ) : (
              <>
                <h3 className="font-heading font-semibold text-sm text-[#E5573F] mt-0.5">
                  No Emergency Contact Configured
                </h3>
                <p className="text-xs text-[#5C6B6E]">
                  Please specify an emergency contact so care navigators can reach your family in a crisis.
                </p>
              </>
            )}
          </div>
        </div>

        {hasContact ? (
          <Link href="/profile/edit#emergency-contact" className="w-full sm:w-auto shrink-0">
            <Button variant="secondary" size="sm" fullWidth>
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              <span>Edit Contact</span>
            </Button>
          </Link>
        ) : (
          <Link href="/profile/edit#emergency-contact" className="w-full sm:w-auto shrink-0">
            <Button variant="urgent" size="sm" fullWidth>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>Add Emergency Contact</span>
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
};
