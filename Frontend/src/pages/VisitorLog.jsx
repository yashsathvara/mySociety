import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { GetVisitors } from "../services/securityGuardService";
import { convert24hrTo12hr } from "../utils/ConvertTime";
import { Loader } from "../utils/Loader";


const VisitorLogs = () => {
  const [visitorLog, setVisitorLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // fetch visitor list
  const fetchVisitors = async () => {
    try {
      setIsLoading(true)
      const response = await GetVisitors();
      setVisitorLog(response.data.data);
    } catch (error) {
      toast.error(error.response.data.message);
    }finally{
      setIsLoading(false)
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  return (
    <div
      className="p-4 sm:p-6 bg-white rounded-lg overflow-auto max-w-full  
    3xl:max-w-[2240px] visiter-table"
    >
      <h1 className="text-[20px] font-semibold mb-6 text-gray-800 max-xl:mb-0 max-sm:mb-[15px]">
        Visitor Logs
      </h1>
      <div className=" relative bg-white rounded-lg shadow-sm overflow-y-auto overflow-x-auto custom-scrollbar">
      {/* Loader */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
         <Loader/>
        </div>
      )}

      {/* Table */}
      <div className="max-h-[45rem] ps-0 pr-[8px]">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-indigo-50 h-[61px]">
            <tr className="text-nowrap text-[#202224]">
              <th className="px-6 py-4 text-left text-[14px] font-semibold rounded-ts-[15px]">
                Visitor Name
              </th>
              <th className="px-6 py-4 text-left text-[14px] font-semibold">
                Phone Number
              </th>
              <th className="px-10 py-4 text-left text-[14px] font-semibold">
                Date
              </th>
              <th className="px-6 py-4 text-center text-[14px] font-semibold">
                Unit Number
              </th>
              <th className="px-4 sm:px-10 py-4 text-right text-[14px] font-semibold rounded-tr-[15px]">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {visitorLog.length > 0 ? (
              visitorLog.map((visitor, index) => (
                <tr key={index} className="hover:bg-gray-50 text-[#4F4F4F]">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={`https://i.pravatar.cc/150?img=${index}`}
                          alt=""
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium ">{visitor.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">{visitor.number}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">
                      {new Date(visitor.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <span className="h-[28px] w-[28px] flex items-center justify-center rounded-full bg-[#5678E91A] text-[#5678E9] text-xs font-medium mr-2">
                        {visitor.wing}
                      </span>
                      <span className="text-sm font-medium">{visitor.unit}</span>
                    </div>
                  </td>
                  <td className="py-4 whitespace-nowrap text-right">
                    <div className="inline-flex justify-center items-center px-3 py-1 font-medium text-sm bg-[#F6F8FB] rounded-full w-[92px] h-[34px]">
                      {convert24hrTo12hr(visitor.time)}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-4">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default VisitorLogs;
