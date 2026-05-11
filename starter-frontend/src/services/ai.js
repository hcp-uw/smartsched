import axios from 'axios';
import { supabase } from '../supabaseClient';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const chat = async (prompt) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await axios.post(`${baseUrl}/api/ai/chat`, 
        { prompt },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
    return response.data;
};

export { chat };
