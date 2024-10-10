import { NextResponse } from 'next/server';

// ฟังก์ชันในการดึงค่าพิกัดจาก query parameter และเรียก OpenAQ API
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const long = searchParams.get('long');

    if (!lat || !long) {
      return NextResponse.json({ error: 'Latitude and Longitude are required' }, { status: 400 });
    }

    // สร้าง URL สำหรับการเรียก API ด้วยค่าพิกัด
    const apiUrl = `https://api.openaq.org/v2/latest?coordinates=${lat},${long}&radius=25000&order_by=distance&sort=asc&limit=1`;

    // เรียก OpenAQ API พร้อมกับ API Key
    const response = await fetch(apiUrl, {
      headers: {
        'x-api-key': '61057871543742634fef96448515394f88ac99ada8ffc7dc4839331d53a2a5ee', // ใส่ API key ของคุณตรงนี้
      }
    });
    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: 'Failed to fetch data from OpenAQ' }, { status: response.status });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
