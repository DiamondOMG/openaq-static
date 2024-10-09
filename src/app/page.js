"use client";

import React, { useEffect, useState } from "react";

export default function Home() {
  const [airQualityData, setAirQualityData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูลอากาศและส่งข้อมูลไปยัง API โดยตรง
  const fetchAirQualityData = async (latitude, longitude) => {
    try {
      const res = await fetch(`/api/airquality?lat=${latitude}&long=${longitude}`);
      const data = await res.json();

      if (data.results.length > 0) {
        const result = data.results[0];
        const location = result.location;
        const pm25Value = result.measurements[0].value;
        const lastUpdated = result.measurements[0].lastUpdated;

        // เซ็ตค่า state เพื่อ render
        setAirQualityData({
          coordinates: { latitude, longitude },
          location,
          pm25Value,
          lastUpdated
        });
      } else {
        // ขยับพิกัดทีละ 100 เมตรแล้วลองใหม่
        const newLatitude = latitude + 0.001; // 100 เมตรในแนวเส้นขนาน
        const newLongitude = longitude + 0.001; // 100 เมตรในแนวเส้นเมริเดียน
        await fetchAirQualityData(newLatitude, newLongitude); // เรียก API ใหม่
      }
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ดึงพิกัดจาก Geolocation API
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const lat = position.coords.latitude;
        const long = position.coords.longitude;

        // ดึงข้อมูลจาก API โดยใช้พิกัดที่ได้จาก Geolocation
        await fetchAirQualityData(lat, long);
      } catch (error) {
        setError("ไม่สามารถดึงตำแหน่งได้");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>กำลังโหลด...</div>;
  if (error) return <div>{error}</div>;

  // ดึงข้อมูลที่ได้จาก state
  const { latitude, longitude } = airQualityData.coordinates;
  const { location, pm25Value, lastUpdated } = airQualityData;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">ข้อมูลคุณภาพอากาศ</h1>
        <ul className="text-gray-700">
          <li><strong>ละติจูด:</strong> {latitude}</li>
          <li><strong>ลองจิจูด:</strong> {longitude}</li>
          <li><strong>สถานที่:</strong> {location}</li>
          <li><strong>ค่า PM2.5:</strong> {pm25Value} µg/m³</li>
          <li><strong>อัปเดตล่าสุด:</strong> {new Date(lastUpdated).toLocaleString()}</li>
        </ul>
      </div>
    </div>
  );
}
