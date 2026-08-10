import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdminTopBar({ admin, onLogout, onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/admin/search-shipments?q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await response.json();
      setSearchResults(data.results || []);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (shipmentId) => {
    setShowResults(false);
    setSearchQuery("");
    navigate("/admin/shipments");
    setTimeout(() => {
      const element = document.getElementById(`shipment-${shipmentId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("highlight-shipment");
        setTimeout(() => element.classList.remove("highlight-shipment"), 2000);
      }
    }, 100);
  };

  return (
    <header className="h-16 flex justify-between items-center px-4 lg:px-gutter border-b border-outline-variant bg-surface sticky top-0 z-40">
      <div className="flex items-center flex-1 gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-all"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div
          className="relative w-full max-w-md group hidden sm:block"
          ref={searchRef}
        >
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full bg-surface-container-low border-outline-variant border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-secondary focus:outline-none text-on-surface transition-all"
            placeholder="Search tracking ID, vehicle, or customer..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-secondary border-t-transparent rounded-full"></div>
            </div>
          )}

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-surface-container-high border border-outline-variant rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result.id)}
                  className="w-full text-left px-4 py-3 hover:bg-surface-container-highest border-b border-outline-variant last:border-b-0 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-on-surface">
                          {result.vehicle_description}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            result.status === "delivered"
                              ? "bg-green-500/20 text-green-400"
                              : result.status === "in_transit"
                                ? "bg-blue-500/20 text-blue-400"
                                : result.status === "cancelled"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {result.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-on-surface-variant space-y-0.5">
                        {result.tracking_number && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">
                              tag
                            </span>
                            <span>{result.tracking_number}</span>
                          </div>
                        )}
                        {result.vin && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">
                              pin
                            </span>
                            <span>VIN: {result.vin}</span>
                          </div>
                        )}
                        {result.customer_name && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">
                              person
                            </span>
                            <span>{result.customer_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">
                      arrow_forward
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showResults &&
            searchQuery.trim().length >= 2 &&
            searchResults.length === 0 &&
            !isSearching && (
              <div className="absolute top-full mt-2 w-full bg-surface-container-high border border-outline-variant rounded-lg shadow-lg p-4 z-50">
                <div className="text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 block">
                    search_off
                  </span>
                  <p>No shipments found</p>
                </div>
              </div>
            )}
        </div>
      </div>
      <div className="flex items-center space-x-md">
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
          <span className="material-symbols-outlined">history</span>
        </button>
        <div className="flex items-center space-x-3 ml-2 border-l border-outline-variant pl-md">
          <div className="text-right">
            <p className="font-label-md text-on-surface">
              {admin?.name || "Admin Center"}
            </p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
              {admin?.role === "superadmin" ? "Superadmin" : "Admin"}
            </p>
          </div>
          <img
            alt="Administrator Avatar"
            className="w-10 h-10 rounded-full object-cover border border-secondary"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBg9bNWZDTd41vYv8gvgcJluAYNz2ul_PIA-H6Ot68anUiMlj_k8UHXfnACGxuq0Nu8BbkWRgQTIGlsqYmqw-MQoDWX5q9zab2R9MKdbXR-p3YLLcR0EaVB6yaw0kN-OCDY8NBgbE1RUbkLuUSGm3yZuUQ_jCiEnly_PBd9-3v3n-xQeGvt9Ar2WOhBHE3ICy30fnuqCTMymvfFX_7h2h-v9TZ7zxwiUjERZt6doCVmgZZkBf44Vq-wjPeskKWRjE9xFEIvTNhF9rKd"
          />
        </div>
      </div>
    </header>
  );
}

export default AdminTopBar;
