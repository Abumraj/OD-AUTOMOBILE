<?php

namespace App\Support;

/**
 * Profit is for super admins only. Everything that decides what a regular admin may see,
 * send, sort by or export about profit goes through here so the rule lives in one place.
 */
class ProfitGuard
{
    /** Columns that hold profit on the service tables (autosales, truckings, clearances, procurements). */
    public const COLUMNS = ['profit', 'profit_ngn'];

    public static function allowed(): bool
    {
        try {
            return request()->session()->get('admin_role', 'admin') === 'superadmin';
        } catch (\Throwable $e) {
            // No session (console, tests): treat as not allowed.
            return false;
        }
    }

    public static function isProfitKey($key): bool
    {
        return is_string($key) && stripos($key, 'profit') !== false;
    }

    /**
     * Remove every profit-related key from a decoded JSON structure, however deeply it is nested
     * (profit, profit_ngn, total_profit, monthly_profit_over_time, ...). Objects stay objects and
     * lists stay lists, so the shape the frontend expects does not change.
     */
    public static function scrub($value)
    {
        if (is_array($value)) {
            foreach ($value as $key => $item) {
                if (self::isProfitKey($key)) {
                    unset($value[$key]);
                } else {
                    $value[$key] = self::scrub($item);
                }
            }

            return $value;
        }

        if (is_object($value)) {
            foreach (get_object_vars($value) as $key => $item) {
                if (self::isProfitKey($key)) {
                    unset($value->{$key});
                } else {
                    $value->{$key} = self::scrub($item);
                }
            }
        }

        return $value;
    }
}
