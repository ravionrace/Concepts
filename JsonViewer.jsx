import { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check, Upload } from 'lucide-react';

const JsonViewer = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [parsedJson, setParsedJson] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const sampleJson = {
    "user": {
      "id": 12345,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "isActive": true,
      "preferences": {
        "theme": "dark",
        "notifications": {
          "email": true,
          "push": false,
          "sms": true
        },
        "languages": ["en", "es", "fr"]
      },
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "country": "USA",
        "zipCode": "10001"
      },
      "orders": [
        {
          "id": "order_001",
          "date": "2024-01-15",
          "total": 299.99,
          "items": ["laptop", "mouse"]
        },
        {
          "id": "order_002",
          "date": "2024-02-20",
          "total": 49.99,
          "items": ["keyboard"]
        }
      ]
    }
  };

  const handleJsonChange = (value) => {
    setJsonInput(value);
    if (value.trim() === '') {
      setParsedJson(null);
      setError('');
      return;
    }

    try {
      const parsed = JSON.parse(value);
      setParsedJson(parsed);
      setError('');
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`);
      setParsedJson(null);
    }
  };

  const loadSample = () => {
    const sampleStr = JSON.stringify(sampleJson, null, 2);
    setJsonInput(sampleStr);
    handleJsonChange(sampleStr);
  };

  const clearJson = () => {
    setJsonInput('');
    setParsedJson(null);
    setError('');
  };

  const copyJson = async () => {
    if (parsedJson) {
      await navigator.clipboard.writeText(JSON.stringify(parsedJson, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatJson = () => {
    if (parsedJson) {
      const formatted = JSON.stringify(parsedJson, null, 2);
      setJsonInput(formatted);
    }
  };

  const minifyJson = () => {
    if (parsedJson) {
      const minified = JSON.stringify(parsedJson);
      setJsonInput(minified);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">JSON Viewer</h1>
          <p className="text-gray-600">Paste your JSON data below to view it in a formatted, interactive tree structure</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">JSON Input</h2>
              <div className="flex gap-2">
                <button
                  onClick={loadSample}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Load Sample
                </button>
                <button
                  onClick={clearJson}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder="Paste your JSON here..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {parsedJson && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={formatJson}
                  className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  Format
                </button>
                <button
                  onClick={minifyJson}
                  className="px-3 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                >
                  Minify
                </button>
                <button
                  onClick={copyJson}
                  className="px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-1"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">JSON Tree View</h2>
            
            {parsedJson ? (
              <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto bg-gray-50">
                <JsonNode data={parsedJson} name="root" />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                <Upload className="mx-auto mb-2 text-gray-400" size={48} />
                <p>Paste valid JSON in the input area to view the tree structure</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        {parsedJson && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">JSON Statistics</h3>
            <JsonStats data={parsedJson} />
          </div>
        )}
      </div>
    </div>
  );
};

const JsonNode = ({ data, name, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const getDataType = (value) => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getTypeColor = (type) => {
    const colors = {
      string: 'text-green-600',
      number: 'text-blue-600',
      boolean: 'text-purple-600',
      null: 'text-gray-500',
      object: 'text-red-600',
      array: 'text-orange-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const renderValue = (value, type) => {
    switch (type) {
      case 'string':
        return `"${value}"`;
      case 'null':
        return 'null';
      case 'boolean':
        return value ? 'true' : 'false';
      case 'array':
        return `Array(${value.length})`;
      case 'object':
        return `Object{${Object.keys(value).length}}`;
      default:
        return String(value);
    }
  };

  if (typeof data !== 'object' || data === null) {
    const type = getDataType(data);
    return (
      <div className={`ml-${level * 4} py-1`}>
        <span className="text-gray-700 font-medium">{name}:</span>{' '}
        <span className={getTypeColor(type)}>{renderValue(data, type)}</span>
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const entries = isArray ? data.map((item, i) => [i, item]) : Object.entries(data);
  const type = getDataType(data);

  return (
    <div className={`ml-${level * 4}`}>
      <div className="flex items-center py-1 cursor-pointer hover:bg-gray-100 rounded px-2 -mx-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mr-2 text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <span className="text-gray-700 font-medium">{name}:</span>{' '}
        <span className={getTypeColor(type)}>{renderValue(data, type)}</span>
      </div>

      {isExpanded && (
        <div className="ml-4 border-l-2 border-gray-200 pl-2">
          {entries.map(([key, value]) => (
            <JsonNode
              key={key}
              data={value}
              name={key}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const JsonStats = ({ data }) => {
  const getStats = (obj) => {
    let stats = {
      objects: 0,
      arrays: 0,
      strings: 0,
      numbers: 0,
      booleans: 0,
      nulls: 0,
      totalKeys: 0
    };

    const traverse = (value) => {
      if (value === null) {
        stats.nulls++;
      } else if (Array.isArray(value)) {
        stats.arrays++;
        value.forEach(traverse);
      } else if (typeof value === 'object') {
        stats.objects++;
        stats.totalKeys += Object.keys(value).length;
        Object.values(value).forEach(traverse);
      } else if (typeof value === 'string') {
        stats.strings++;
      } else if (typeof value === 'number') {
        stats.numbers++;
      } else if (typeof value === 'boolean') {
        stats.booleans++;
      }
    };

    traverse(obj);
    return stats;
  };

  const stats = getStats(data);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(stats).map(([key, value]) => (
        <div key={key} className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{value}</div>
          <div className="text-sm text-gray-600 capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default JsonViewer;
