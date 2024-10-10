"use client";

import React, { useEffect, useState } from "react";

export default function Home() {
  const [airQualityData, setAirQualityData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูลอากาศและส่งข้อมูลไปยัง API โดยตรง
  const fetchAirQualityData = async (latitude, longitude, retryCount = 0) => {
    try {
      const res = await fetch(`/api/airquality?lat=${latitude}&long=${longitude}`);
      const data = await res.json();

      if (data.results.length > 0) {
        const result = data.results[0];
        const location = result.location;
        
        // หา object ที่มี parameter เป็น "pm25"
        const pm25Measurement = result.measurements.find(measurement => measurement.parameter === "pm25");

        if (pm25Measurement) {
          const pm25Value = pm25Measurement.value;
          const lastUpdated = pm25Measurement.lastUpdated;

          // เซ็ตค่า state เพื่อ render
          setAirQualityData({
            coordinates: { latitude, longitude },
            location,
            pm25Value,
            lastUpdated,
          });
        } else {
          setError("ไม่พบข้อมูลค่า PM2.5 สำหรับตำแหน่งนี้");
        }
      } else if (retryCount < 5) {
        // ขยับพิกัดทีละ 100 เมตรแล้วลองใหม่
        const newLatitude = latitude + 0.25; 
        const newLongitude = longitude + 0.25; 
        console.log(`Retrying with new coords: lat ${newLatitude}, long ${newLongitude}`);
        await fetchAirQualityData(newLatitude, newLongitude, retryCount + 1); // เรียก API ใหม่
      } else {
        setError("ไม่พบข้อมูลอากาศสำหรับตำแหน่งนี้หลังจากพยายามหลายครั้ง");
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
  const { latitude, longitude } = airQualityData?.coordinates || {};
  const { location, pm25Value, lastUpdated } = airQualityData || {};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">ข้อมูลคุณภาพอากาศ</h1>
        <ul className="text-gray-700">
          <li><strong>ละติจูด:</strong> {latitude}</li>
          <li><strong>ลองจิจูด:</strong> {longitude}</li>
          <li><strong>สถานที่:</strong> {location}</li>
          <li><strong>ค่า PM2.5:</strong> {pm25Value} µg/m³</li>
          <li><strong>อัปเดตล่าสุด:</strong> {lastUpdated ? new Date(lastUpdated).toLocaleString() : ''}</li>
        </ul>
      </div>
    </div>
  );
}
