import { supabase } from './supabase'

export async function testSupabaseConnection() {
    const { data, error } = await supabase
        .from('test_connection')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Supabase connection error:', error)
        return false
    }

    console.log('Supabase connected:', data)
    return true
}