import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a chainable mock query builder for development without env vars
const createMockQueryBuilder = () => {
    const mockResult = { data: [], error: null };
    const builder = {
        select: () => builder,
        insert: () => builder,
        update: () => builder,
        delete: () => builder,
        eq: () => builder,
        neq: () => builder,
        gt: () => builder,
        gte: () => builder,
        lt: () => builder,
        lte: () => builder,
        like: () => builder,
        ilike: () => builder,
        is: () => builder,
        in: () => builder,
        contains: () => builder,
        order: () => builder,
        limit: () => builder,
        range: () => builder,
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        then: (resolve) => resolve(mockResult),
        // Make it thenable so await works
        [Symbol.toStringTag]: 'Promise',
    };
    // Add Promise methods for await support
    builder.then = (onFulfilled, onRejected) => Promise.resolve(mockResult).then(onFulfilled, onRejected);
    builder.catch = (onRejected) => Promise.resolve(mockResult).catch(onRejected);
    builder.finally = (onFinally) => Promise.resolve(mockResult).finally(onFinally);
    return builder;
};

// Create a mock client if no Supabase URL is provided (for development without env vars)
export const supabase = supabaseUrl
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => createMockQueryBuilder(),
    };
