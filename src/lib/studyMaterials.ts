import { supabase } from './supabase'

export interface StudyMaterial {
    id: string
    type: string
    title: string | null
    content: string
    file_name: string | null
    file_size: number | null
    created_at: string
}

export async function createStudyMaterial(content: string) {
    const trimmedContent = content.trim()

    if (!trimmedContent) {
        throw new Error('Study Material is empty')
    }

    const id = crypto.randomUUID()

    const { error } = await supabase
        .from('study_materials')
        .insert({
            id,
            type: 'text',
            title: null,
            content: trimmedContent,
            file_name: null,
            file_size: null,
        })

    if (error) {
        console.error('Create Study Material Error:', error)
        throw error
    }

    return {
        id,
        content: trimmedContent,
    }
}

export async function getStudyMaterial(id: string) {
    const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Get Study Material Error:', error)
        throw error
    }

    return data as StudyMaterial
}