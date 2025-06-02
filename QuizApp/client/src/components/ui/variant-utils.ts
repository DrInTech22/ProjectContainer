import { cva, type VariantProps } from "class-variance-authority";

/**
 * Variant utility for different question statuses
 */
export const questionStatusVariants = cva("", {
  variants: {
    status: {
      unanswered: "",
      correct: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      incorrect: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    },
  },
  defaultVariants: {
    status: "unanswered",
  },
});

export type QuestionStatusVariantProps = VariantProps<typeof questionStatusVariants>;

/**
 * Variant utility for different alert types
 */
export const alertVariants = cva("", {
  variants: {
    variant: {
      default: "bg-gray-100 dark:bg-gray-800",
      success: "bg-success bg-opacity-10 dark:bg-opacity-20 text-success",
      error: "bg-destructive bg-opacity-10 dark:bg-opacity-20 text-destructive",
      warning: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300",
      info: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
    }
  },
  defaultVariants: {
    variant: "default",
  },
});

export type AlertVariantProps = VariantProps<typeof alertVariants>;
