// components/plans/PlanFormFields.tsx

import type { Control, UseFormRegister } from "react-hook-form";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import type { SubscriptionPlanFormInput } from "@/lib/validations/subscriptionPlan.validation";

interface PlanFormFieldsProps {
  control: Control<SubscriptionPlanFormInput>;
  register: UseFormRegister<SubscriptionPlanFormInput>;
}

export function PlanFormFields({ control, register }: PlanFormFieldsProps) {
  return (
    <>
      <FormField label="Plan Name" required>
        <FormInput<SubscriptionPlanFormInput>
          name="plan_name"
          control={control}
          placeholder="e.g. Pro"
        />
      </FormField>

      <FormField label="Description">
        <FormInput<SubscriptionPlanFormInput>
          name="description"
          control={control}
          as="textarea"
          rows={3}
          placeholder="Short description of what this plan includes"
        />
      </FormField>

      <FormField label="Price (NPR)" required>
        <FormInput<SubscriptionPlanFormInput>
          name="price"
          control={control}
          placeholder="e.g. 2500"
        />
      </FormField>

      <FormField label="Billing Interval" required>
        <select
          {...register("billing_interval")}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </FormField>

      <FormField label="Max Users">
        <FormInput<SubscriptionPlanFormInput>
          name="max_users"
          control={control}
          placeholder="Leave blank for unlimited"
        />
      </FormField>

      <FormField label="Max Interviews / Month">
        <FormInput<SubscriptionPlanFormInput>
          name="max_interviews_per_month"
          control={control}
          placeholder="Leave blank for unlimited"
        />
      </FormField>

      <FormField label="Storage Limit (MB)">
        <FormInput<SubscriptionPlanFormInput>
          name="storage_limit_mb"
          control={control}
          placeholder="Leave blank for unlimited"
        />
      </FormField>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register("is_active")}
          id="is_active"
          className="rounded border-gray-300"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
          Active (can be assigned to channels)
        </label>
      </div>
    </>
  );
}