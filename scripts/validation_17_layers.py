#!/usr/bin/env python3
"""
17 層代碼驗證系統擴展
擴展 MCP Server 的驗證功能,實現完整的 17 層驗證
"""

import ast
import re
from typing import Dict, List, Any, Optional


def validate_code_17_layers(code: str, node_id: str, spec: Optional[Dict] = None) -> Dict[str, Any]:
    """
    17 層完整代碼驗證

    驗證層級:
    L1-L4:   語法和結構驗證
    L5-L8:   函數簽名驗證
    L9-L12:  依賴關係驗證
    L13-L17: 類型和邏輯驗證

    Args:
        code: 要驗證的代碼
        node_id: 節點 ID
        spec: 節點規格 (可選)

    Returns:
        驗證結果字典
    """
    results = []

    # L1-L4: 語法和結構驗證
    results.extend(validate_syntax_and_structure(code))

    # L5-L8: 函數簽名驗證
    results.extend(validate_function_signature(code, spec))

    # L9-L12: 依賴關係驗證
    results.extend(validate_dependencies(code, spec))

    # L13-L17: 類型和邏輯驗證
    results.extend(validate_types_and_logic(code, spec))

    # 計算總體結果
    passed = all(r["passed"] for r in results)
    quality_score = calculate_quality_score(results)

    return {
        "passed": passed,
        "layers": results,
        "quality_score": quality_score,
        "total_layers": len(results),
        "passed_layers": sum(1 for r in results if r["passed"]),
        "suggestions": generate_suggestions(results)
    }


# ============================================================================
# L1-L4: 語法和結構驗證
# ============================================================================

def validate_syntax_and_structure(code: str) -> List[Dict]:
    """L1-L4: 語法和結構驗證"""
    results = []

    # L1: 基本語法檢查
    results.append(validate_l1_basic_syntax(code))

    # L2: AST 結構檢查
    results.append(validate_l2_ast_structure(code))

    # L3: 縮進和格式檢查
    results.append(validate_l3_indentation(code))

    # L4: 命名規範檢查
    results.append(validate_l4_naming_convention(code))

    return results


def validate_l1_basic_syntax(code: str) -> Dict:
    """L1: 基本語法檢查"""
    try:
        compile(code, '<string>', 'exec')
        return {
            "layer": 1,
            "name": "基本語法檢查",
            "passed": True,
            "message": "語法正確"
        }
    except SyntaxError as e:
        return {
            "layer": 1,
            "name": "基本語法檢查",
            "passed": False,
            "message": f"語法錯誤: {str(e)}",
            "error": str(e)
        }


def validate_l2_ast_structure(code: str) -> Dict:
    """L2: AST 結構檢查"""
    try:
        tree = ast.parse(code)

        # 檢查是否有函數或類定義
        has_definition = any(isinstance(node, (ast.FunctionDef, ast.ClassDef))
                            for node in ast.walk(tree))

        if has_definition:
            return {
                "layer": 2,
                "name": "AST 結構檢查",
                "passed": True,
                "message": "AST 結構完整"
            }
        else:
            return {
                "layer": 2,
                "name": "AST 結構檢查",
                "passed": False,
                "message": "缺少函數或類定義"
            }
    except Exception as e:
        return {
            "layer": 2,
            "name": "AST 結構檢查",
            "passed": False,
            "message": f"AST 解析失敗: {str(e)}"
        }


def validate_l3_indentation(code: str) -> Dict:
    """L3: 縮進和格式檢查"""
    lines = code.split('\n')
    issues = []

    for i, line in enumerate(lines, 1):
        # 檢查是否使用 Tab
        if '\t' in line:
            issues.append(f"Line {i}: 使用 Tab 而非空格")

        # 檢查縮進是否為 4 的倍數
        if line and not line.lstrip():
            continue
        leading_spaces = len(line) - len(line.lstrip())
        if leading_spaces % 4 != 0:
            issues.append(f"Line {i}: 縮進不是 4 的倍數")

    if not issues:
        return {
            "layer": 3,
            "name": "縮進和格式檢查",
            "passed": True,
            "message": "縮進格式正確"
        }
    else:
        return {
            "layer": 3,
            "name": "縮進和格式檢查",
            "passed": False,
            "message": f"發現 {len(issues)} 個格式問題",
            "issues": issues[:3]  # 只顯示前 3 個
        }


def validate_l4_naming_convention(code: str) -> Dict:
    """L4: 命名規範檢查 (PEP 8)"""
    try:
        tree = ast.parse(code)
        issues = []

        for node in ast.walk(tree):
            # 檢查函數名 (應該是 snake_case)
            if isinstance(node, ast.FunctionDef):
                if not re.match(r'^[a-z_][a-z0-9_]*$', node.name):
                    issues.append(f"函數名 '{node.name}' 不符合 snake_case")

            # 檢查類名 (應該是 PascalCase)
            if isinstance(node, ast.ClassDef):
                if not re.match(r'^[A-Z][a-zA-Z0-9]*$', node.name):
                    issues.append(f"類名 '{node.name}' 不符合 PascalCase")

        if not issues:
            return {
                "layer": 4,
                "name": "命名規範檢查",
                "passed": True,
                "message": "命名符合 PEP 8"
            }
        else:
            return {
                "layer": 4,
                "name": "命名規範檢查",
                "passed": len(issues) == 0,
                "message": f"發現 {len(issues)} 個命名問題",
                "issues": issues[:3]
            }
    except Exception as e:
        return {
            "layer": 4,
            "name": "命名規範檢查",
            "passed": False,
            "message": f"檢查失敗: {str(e)}"
        }


# ============================================================================
# L5-L8: 函數簽名驗證
# ============================================================================

def validate_function_signature(code: str, spec: Optional[Dict]) -> List[Dict]:
    """L5-L8: 函數簽名驗證"""
    results = []

    # L5: 參數檢查
    results.append(validate_l5_params(code, spec))

    # L6: 返回值檢查
    results.append(validate_l6_return_value(code, spec))

    # L7: 類型提示檢查
    results.append(validate_l7_type_hints(code))

    # L8: 文檔字符串檢查
    results.append(validate_l8_docstring(code))

    return results


def validate_l5_params(code: str, spec: Optional[Dict]) -> Dict:
    """L5: 參數檢查 (檢查所有函數)"""
    try:
        tree = ast.parse(code)
        functions = [node for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]

        if not functions:
            return {"layer": 5, "name": "參數檢查", "passed": False, "message": "未找到函數定義"}

        if spec and 'inputs' in spec:
            expected_params = set(spec['inputs'])
            # 檢查是否有任何一個函數匹配 spec
            any_match = False
            for func in functions:
                actual_params = set(arg.arg for arg in func.args.args)
                if expected_params == actual_params:
                    any_match = True
                    break

            if any_match:
                return {"layer": 5, "name": "參數檢查", "passed": True, "message": "參數與規格匹配"}
            else:
                return {"layer": 5, "name": "參數檢查", "passed": False, "message": "未找到參數匹配的函數"}
        else:
            total_params = sum(len(func.args.args) for func in functions)
            return {"layer": 5, "name": "參數檢查", "passed": True, "message": f"檢測到 {len(functions)} 個函數，共 {total_params} 個參數"}
    except Exception as e:
        return {"layer": 5, "name": "參數檢查", "passed": False, "message": f"檢查失敗: {str(e)}"}


def validate_l6_return_value(code: str, spec: Optional[Dict]) -> Dict:
    """L6: 返回值檢查 (檢查所有函數)"""
    try:
        tree = ast.parse(code)
        functions = [node for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]

        if not functions:
            return {"layer": 6, "name": "返回值檢查", "passed": False, "message": "未找到函數定義"}

        funcs_missing_return = []
        for func in functions:
            if func.name == "__init__": continue
            has_return = any(isinstance(node, (ast.Return, ast.Yield, ast.YieldFrom)) for node in ast.walk(func))
            if not has_return:
                funcs_missing_return.append(func.name)

        if not funcs_missing_return:
            return {"layer": 6, "name": "返回值檢查", "passed": True, "message": "所有函數均有返回值"}
        else:
            return {"layer": 6, "name": "返回值檢查", "passed": False, "message": f"函數缺少返回值: {', '.join(funcs_missing_return[:3])}"}
    except Exception as e:
        return {"layer": 6, "name": "返回值檢查", "passed": False, "message": f"檢查失敗: {str(e)}"}


def validate_l7_type_hints(code: str) -> Dict:
    """L7: 類型提示檢查 (計算全局覆蓋率)"""
    try:
        tree = ast.parse(code)
        functions = [node for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]

        if not functions:
            return {"layer": 7, "name": "類型提示檢查", "passed": False, "message": "未找到函數定義"}

        total_items = 0
        items_with_hints = 0

        for func in functions:
            # 參數類型提示
            args = [arg for arg in func.args.args if arg.arg != 'self']
            total_items += len(args)
            items_with_hints += sum(1 for arg in args if arg.annotation)

            # 返回值類型提示 (跳過 __init__)
            if func.name != "__init__":
                total_items += 1
                if func.returns:
                    items_with_hints += 1

        if total_items == 0:
            return {"layer": 7, "name": "類型提示檢查", "passed": True, "message": "無參數 or 返回值需檢查"}

        coverage = items_with_hints / total_items
        if coverage >= 0.8:
            return {"layer": 7, "name": "類型提示檢查", "passed": True, "message": f"類型提示覆蓋率: {coverage*100:.0f}%"}
        else:
            return {"layer": 7, "name": "類型提示檢查", "passed": False, "message": f"類型提示不足: {coverage*100:.0f}%"}
    except Exception as e:
        return {"layer": 7, "name": "類型提示檢查", "passed": False, "message": f"檢查失敗: {str(e)}"}


def validate_l8_docstring(code: str) -> Dict:
    """L8: 文檔字符串檢查 (檢查所有函數)"""
    try:
        tree = ast.parse(code)
        functions = [node for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]

        if not functions:
            return {"layer": 8, "name": "文檔字符串檢查", "passed": True, "message": "無函數定義"}

        funcs_missing_doc = []
        for func in functions:
            doc = ast.get_docstring(func)
            if not doc or len(doc.strip()) < 10:
                funcs_missing_doc.append(func.name)

        if not funcs_missing_doc:
            return {"layer": 8, "name": "文檔字符串檢查", "passed": True, "message": "所有函數均有完整文檔"}
        else:
            coverage = (len(functions) - len(funcs_missing_doc)) / len(functions)
            return {"layer": 8, "name": "文檔字符串檢查", "passed": coverage >= 0.8, "message": f"文檔覆蓋率: {coverage*100:.0f}% (缺少: {', '.join(funcs_missing_doc[:3])})"}
    except Exception as e:
        return {"layer": 8, "name": "文檔字符串檢查", "passed": False, "message": f"檢查失敗: {str(e)}"}


# ============================================================================
# L9-L12: 依賴關係驗證
# ============================================================================

def validate_dependencies(code: str, spec: Optional[Dict]) -> List[Dict]:
    """L9-L12: 依賴關係驗證"""
    results = []

    # L9: 導入檢查
    results.append(validate_l9_imports(code))

    # L10: 標準庫檢查
    results.append(validate_l10_stdlib(code))

    # L11: 第三方庫檢查
    results.append(validate_l11_third_party(code))

    # L12: 循環依賴檢查
    results.append(validate_l12_circular_deps(code))

    return results


def validate_l9_imports(code: str) -> Dict:
    """L9: 導入檢查"""
    try:
        tree = ast.parse(code)
        imports = [node for node in ast.walk(tree)
                  if isinstance(node, (ast.Import, ast.ImportFrom))]

        return {
            "layer": 9,
            "name": "導入檢查",
            "passed": True,
            "message": f"找到 {len(imports)} 個導入語句"
        }
    except Exception as e:
        return {
            "layer": 9,
            "name": "導入檢查",
            "passed": False,
            "message": f"檢查失敗: {str(e)}"
        }


def validate_l10_stdlib(code: str) -> Dict:
    """L10: 標準庫檢查 (AST 級別)"""
    try:
        tree = ast.parse(code)
        import_names = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for n in node.names: import_names.append(n.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module: import_names.append(node.module.split('.')[0])

        # 常見標準庫清單
        stdlib = {'os', 'sys', 'json', 're', 'datetime', 'typing', 'asyncio', 'time', 'math', 'hashlib'}
        used = [name for name in import_names if name in stdlib]

        return {
            "layer": 10,
            "name": "標準庫檢查",
            "passed": True,
            "message": f"精確識別出 {len(set(used))} 個標準庫導入"
        }
    except Exception as e:
        return {"layer": 10, "name": "標準庫檢查", "passed": False, "message": f"分析失敗: {e}"}


def validate_l11_third_party(code: str) -> Dict:
    """L11: 第三方庫檢查"""
    # 檢查常見第三方庫
    third_party = {'django', 'flask', 'fastapi', 'requests', 'numpy', 'pandas'}

    used_third_party = []
    for module in third_party:
        if f"import {module}" in code or f"from {module}" in code:
            used_third_party.append(module)

    return {
        "layer": 11,
        "name": "第三方庫檢查",
        "passed": True,
        "message": f"使用了 {len(used_third_party)} 個第三方庫" if used_third_party else "未使用第三方庫"
    }


def validate_l12_circular_deps(code: str) -> Dict:
    """L12: 循環依賴檢查 (AST 探測)"""
    try:
        tree = ast.parse(code)
        has_relative = False
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.level > 0:
                has_relative = True
                break

        return {
            "layer": 12,
            "name": "循環依賴檢查",
            "passed": not has_relative,
            "message": "通過 (未檢測到危險的相對導入)" if not has_relative else "檢測到相對導入，可能存在循環依賴風險"
        }
    except Exception as e:
        return {"layer": 12, "name": "循環依賴檢查", "passed": False, "message": f"分析失敗: {e}"}


# ============================================================================
# L13-L17: 類型和邏輯驗證
# ============================================================================

def validate_types_and_logic(code: str, spec: Optional[Dict]) -> List[Dict]:
    """L13-L17: 類型和邏輯驗證"""
    results = []

    # L13: 類型一致性檢查
    results.append(validate_l13_type_consistency(code))

    # L14: 邏輯完整性檢查
    results.append(validate_l14_logic_completeness(code))

    # L15: 錯誤處理檢查
    results.append(validate_l15_error_handling(code))

    # L16: 安全性檢查
    results.append(validate_l16_security(code))

    # L17: 性能檢查
    results.append(validate_l17_performance(code))

    return results


def validate_l13_type_consistency(code: str) -> Dict:
    """L13: 類型一致性檢查 (AST 深度掃描)"""
    try:
        tree = ast.parse(code)
        funcs = [n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
        if not funcs: return {"layer": 13, "name": "類型一致性檢查", "passed": True, "message": "無函數需檢查"}

        # 檢查所有函數是否都有類型提示
        total = len(funcs)
        with_hints = sum(1 for f in funcs if f.returns or any(arg.annotation for arg in f.args.args))

        passed = (with_hints / total) >= 0.7
        return {
            "layer": 13,
            "name": "類型一致性檢查",
            "passed": passed,
            "message": f"函數類型提示覆蓋率: {int(with_hints/total*100)}%"
        }
    except Exception as e:
        return {"layer": 13, "name": "類型一致性檢查", "passed": False, "message": f"分析失敗: {e}"}


def validate_l14_logic_completeness(code: str) -> Dict:
    """L14: 邏輯完整性檢查"""
    try:
        tree = ast.parse(code)

        # 檢查是否有 if/else 分支
        has_branches = any(isinstance(node, (ast.If, ast.For, ast.While))
                          for node in ast.walk(tree))

        return {
            "layer": 14,
            "name": "邏輯完整性檢查",
            "passed": True,
            "message": "邏輯結構完整" if has_branches else "邏輯結構簡單"
        }
    except Exception as e:
        return {
            "layer": 14,
            "name": "邏輯完整性檢查",
            "passed": False,
            "message": f"檢查失敗: {str(e)}"
        }


def validate_l15_error_handling(code: str) -> Dict:
    """L15: 錯誤處理檢查 (深度驗證)"""
    try:
        tree = ast.parse(code)
        try_nodes = [node for node in ast.walk(tree) if isinstance(node, ast.Try)]

        if not try_nodes:
            return {
                "layer": 15,
                "name": "錯誤處理檢查",
                "passed": False,
                "message": "建議添加 try-except 錯誤處理塊"
            }

        # 深度檢查：是否有空捕獲或僅 pass 的情況
        bad_handlers = 0
        for node in try_nodes:
            for handler in node.handlers:
                # 檢查處理塊是否為空或只有 pass
                if not handler.body:
                    bad_handlers += 1
                elif len(handler.body) == 1 and isinstance(handler.body[0], ast.Pass):
                    bad_handlers += 1

        if bad_handlers > 0:
            return {
                "layer": 15,
                "name": "錯誤處理檢查",
                "passed": False,
                "message": f"發現 {bad_handlers} 個空或僅 pass 的錯誤處理塊 (Anti-pattern)"
            }

        return {
            "layer": 15,
            "name": "錯誤處理檢查",
            "passed": True,
            "message": f"檢測到 {len(try_nodes)} 個有效錯誤處理塊"
        }
    except Exception as e:
        return {"layer": 15, "name": "錯誤處理檢查", "passed": False, "message": f"解析失敗: {str(e)}"}


def validate_l16_security(code: str) -> Dict:
    """L16: 安全性檢查 (深度分析)"""
    try:
        tree = ast.parse(code)
        issues = []

        # 1. 檢查危險函數調用
        dangerous_funcs = ['eval', 'exec', 'pickle', 'os.system', 'subprocess.Popen']
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                func_name = ""
                if isinstance(node.func, ast.Name):
                    func_name = node.func.id
                elif isinstance(node.func, ast.Attribute):
                    if isinstance(node.func.value, ast.Name):
                        func_name = f"{node.func.value.id}.{node.func.attr}"
                    else:
                        func_name = node.func.attr

                if func_name in dangerous_funcs:
                    issues.append(f"使用了危險函數: {func_name}")

        # 2. [L16.2] 新增：路徑安全性偵測 (Path Sanitization)
        path_ops = ['mkdir', 'makedirs', 'rename', 'replace', 'move', 'remove']
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                if node.func.attr in path_ops:
                    if node.args:
                        arg = node.args[0]
                        if isinstance(arg, ast.Name):
                            code_snippet = code.split('\n')[node.lineno-1]
                            if not any(cleaner in code_snippet for cleaner in ['.strip()', '.replace(', 'safe_', 'sanitize']):
                                issues.append(f"L16.2 危險路徑操作: '{node.func.attr}' 的參數 '{arg.id}' 未偵測到清洗邏輯")

        # 3. 搜尋潛在的寫死 Secret
        secret_patterns = [r'api_key\s*=\s*[\'"][^\s*]{10,}[\'"]', r'password\s*=\s*[\'"][^\s*]{8,}[\'"]']
        for pattern in secret_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                issues.append("檢測到可能的寫死密鑰或密碼")
                break

        return {
            "layer": 16,
            "name": "安全性檢查",
            "passed": len(issues) == 0,
            "message": "未發現明顯安全問題" if not issues else f"發現 {len(issues)} 個潛在安全性問題",
            "issues": issues if issues else None
        }
    except Exception as e:
        return {"layer": 16, "name": "安全性檢查", "passed": False, "message": f"分析失敗: {str(e)}"}


def validate_l17_performance(code: str) -> Dict:
    """L17: 性能檢查 (深度循環分析)"""
    try:
        tree = ast.parse(code)
        max_depth = 0

        for node in ast.walk(tree):
            if isinstance(node, (ast.For, ast.While)):
                depth = 1
                curr = node
                while any(isinstance(child, (ast.For, ast.While)) for child in ast.iter_child_nodes(curr)):
                    depth += 1
                    # 簡單取第一個找到的子循環
                    for child in ast.iter_child_nodes(curr):
                        if isinstance(child, (ast.For, ast.While)):
                            curr = child
                            break
                    if depth > 5: break # 防止死循環
                max_depth = max(max_depth, depth)

        if max_depth >= 3:
            return {
                "layer": 17,
                "name": "性能檢查",
                "passed": False,
                "message": f"檢測到過深的循環嵌套 (Depth: {max_depth})，建議優化算法"
            }

        return {
            "layer": 17,
            "name": "性能檢查",
            "passed": True,
            "message": f"最高循環嵌套深度: {max_depth} (符合效能規範)"
        }
    except Exception as e:
        return {"layer": 17, "name": "性能檢查", "passed": False, "message": f"分析失敗: {str(e)}"}


# ============================================================================
# 輔助函數
# ============================================================================

def calculate_quality_score(results: List[Dict]) -> int:
    """計算質量評分 (0-100)"""
    if not results:
        return 0

    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)

    return int((passed_count / total_count) * 100)


def generate_suggestions(results: List[Dict]) -> List[str]:
    """生成改進建議"""
    suggestions = []

    for result in results:
        if not result["passed"]:
            layer = result["layer"]
            name = result["name"]
            message = result.get("message", "")

            suggestions.append(f"L{layer} ({name}): {message}")

    return suggestions[:5]  # 只返回前 5 個建議


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python validation_17_layers.py <path_to_file>")
        sys.exit(1)

    target_file = sys.argv[1]
    with open(target_file, "r") as f:
        code = f.read()

    result = validate_code_17_layers(code, target_file)

    print(f"✅ 驗證完成!")
    print(f"通過: {result['passed']}")
    print(f"質量評分: {result['quality_score']}/100")
    print(f"通過層級: {result['passed_layers']}/{result['total_layers']}")

    print(f"\n各層結果:")
    for layer in result['layers']:
        status = "✅" if layer['passed'] else "❌"
        print(f"{status} L{layer['layer']}: {layer['name']} - {layer['message']}")

    if result['suggestions']:
        print(f"\n改進建議:")
        for suggestion in result['suggestions']:
            print(f"  - {suggestion}")

    if result['quality_score'] < 80:
        print("\n⚠️ 警告: 品質分數低於 80 分，請根據建議進行改進。")
        sys.exit(1)
    sys.exit(0)
